"""
Sistema de Disparos de Mensagem (SDR) — v3 PARALELO
Batch Round-Robin com ThreadPoolExecutor.
Delay nativo UAZAPI (campo 'delay' em ms no payload).

Fluxo por LOTE:
  1. Fatia leads em lotes do tamanho das instâncias
  2. Todos os leads do lote disparam SIMULTANEAMENTE (threads)
  3. Delay anti-ban SOMENTE entre lotes
  4. Cada envio usa o campo nativo 'delay' da UAZAPI (digitando...)
"""

import re
import time
import random
import logging
import uuid
import json
import httpx  # type: ignore[import-not-found]
import threading
import concurrent.futures
from datetime import datetime, date, timedelta
from database import supabase, log_to_db, get_automation_settings, get_now_br, update_progress, update_instance_progress, reset_instance_progress, send_error_alert  # type: ignore[import-not-found]

logger = logging.getLogger(__name__)

# Lock de instancia: impede que a mesma instancia processe 2 leads simultaneamente
_instance_lock = threading.Lock()
_active_instances: set[str] = set()

# Timeout alto para suportar o delay nativo da UAZAPI (que segura a resposta)
HTTP_TIMEOUT = 60
MAX_RETRIES = 2
RETRY_DELAY = 2


# ===============================================================
# UTILIDADES
# ===============================================================

def format_phone(phone: str) -> str | None:
    """
    Formata telefone para padrão UAZAPI (55 + DDD + 8 dígitos).
    Remove 9° dígito se necessário.
    Retorna None se inválido.
    """
    if not phone:
        return None

    clean = re.sub(r'\D', '', phone)

    if clean.startswith('55') and len(clean) >= 12:
        clean = clean[2:]  # type: ignore[index]

    if len(clean) < 10:
        return None

    ddd = clean[:2]  # type: ignore[index]
    numero = clean[2:]  # type: ignore[index]

    if len(numero) == 9 and numero.startswith('9'):
        numero = numero[1:]

    return f"55{ddd}{numero}"


def _http_post_with_retry(url: str, json_data: dict, headers: dict, max_retries: int = MAX_RETRIES) -> httpx.Response | None:
    """
    POST HTTP com timeout e retry automático.
    Fix #1: WinError 10035 — socket sem bloqueio.
    """
    for attempt in range(max_retries + 1):
        try:
            response = httpx.post(
                url,
                json=json_data,
                headers=headers,
                timeout=HTTP_TIMEOUT
            )
            return response
        except (httpx.ConnectError, httpx.TimeoutException, httpx.ReadError, OSError) as e:
            logger.warning(f"[HTTP] Tentativa {attempt+1}/{max_retries+1} falhou para {url}: {e}")
            if attempt < max_retries:
                time.sleep(RETRY_DELAY)
            else:
                logger.error(f"[HTTP] Todas as tentativas falharam para {url}: {e}")
                return None
        except Exception as e:
            logger.error(f"[HTTP] Erro inesperado em {url}: {e}")
            return None


def check_whatsapp_number(url: str, token: str, phone: str) -> bool:
    """
    Verifica se número existe no WhatsApp via UAZAPI.
    Retorna True (existe) ou False (não existe).
    Raises Exception se a instância estiver desconectada ou com erro de API
    (401/403/5xx/timeout/"WhatsApp disconnected").
    """
    endpoint = f"{url}/chat/check"
    response = _http_post_with_retry(
        endpoint,
        json_data={"numbers": [phone]},
        headers={"Content-Type": "application/json", "token": token}
    )

    if response is None:
        raise Exception("CRITICAL: UAZAPI Instance unreachable (no HTTP response)")

    # --- Detectar instância desconectada / auth falha ---
    if response.status_code in (401, 403):
        raise Exception(f"CRITICAL: UAZAPI Instance Auth Failed (HTTP {response.status_code})")

    # --- HTTP 5xx: instância caiu ou WhatsApp desconectado ---
    if response.status_code >= 500:
        try:
            err_body = response.json()
            err_msg = err_body.get('message', response.text[:200])
        except Exception:
            err_msg = response.text[:200]
        raise Exception(f"CRITICAL: UAZAPI API Error (HTTP {response.status_code}): {err_msg}")

    if response.status_code == 200:
        data = response.json()
        # Verificar se a resposta indica instância não pareada/desconectada
        if isinstance(data, dict):
            status_val = data.get('status', '').lower()
            connected = data.get('connected', True)
            err_flag = data.get('error', False)
            err_message = str(data.get('message', '')).lower()
            if 'not connected' in status_val or 'disconnected' in status_val or connected is False:
                raise Exception(f"CRITICAL: UAZAPI Instance Disconnected (status={data.get('status')}, connected={connected})")
            if err_flag and ('disconnected' in err_message or 'not connected' in err_message):
                raise Exception(f"CRITICAL: UAZAPI Instance Disconnected ({data.get('message')})")
        if isinstance(data, list) and len(data) > 0:
            item = data[0]
            if item.get('error') and ('not connected' in str(item.get('error', '')).lower() or 'instance' in str(item.get('error', '')).lower()):
                raise Exception(f"CRITICAL: UAZAPI Instance Disconnected ({item.get('error')})")
            return item.get('isInWhatsapp', False)
    else:
        # Qualquer outro status inesperado (4xx que não 401/403)
        logger.warning(f"UAZAPI check failed ({response.status_code}): {response.text[:100]}")

    return False


def calculate_typing_delay_ms(text: str) -> int:
    """
    Calcula delay dinâmico em MILISSEGUNDOS para o campo nativo 'delay' da UAZAPI.
    Simula velocidade de digitação humana (~40 palavras/min).
    Mínimo 3000ms, máximo 12000ms.
    """
    words = len(text.split())
    base_delay = 2.0
    per_word = 0.3
    delay_seconds = base_delay + (words * per_word)
    jitter = random.uniform(-0.5, 1.0)
    delay_seconds = max(3.0, min(12.0, delay_seconds + jitter))
    return int(delay_seconds * 1000)  # Converter para milissegundos


def _send_presence_composing(url: str, token: str, phone: str, delay_ms: int) -> None:
    """Envia status 'digitando...' real para o celular do cliente via UAZAPI."""
    try:
        delay_sec = max(1, delay_ms // 1000)
        _http_post_with_retry(
            f"{url}/chat/presence",
            json_data={"number": phone, "delay": delay_sec, "presence": "composing"},
            headers={"Content-Type": "application/json", "token": token},
            max_retries=0
        )
    except Exception as e:
        logger.warning(f"[SDR] Presence/composing falhou (nao-critico): {e}")


def send_message_humanized(url: str, token: str, phone: str, text: str) -> bool:
    """
    Envio humanizado usando o campo nativo 'delay' da UAZAPI.
    Envia presence/composing ANTES para garantir que 'digitando...' apareca.
    O HTTP segura a resposta ate o envio real -- por isso timeout=60s.
    """
    delay_ms = calculate_typing_delay_ms(text)
    logger.info(f"[SDR] [HUMANIZADO] Enviando com delay nativo {delay_ms}ms ({len(text.split())} palavras)")

    # Enviar presence/composing ANTES do envio real
    _send_presence_composing(url, token, phone, delay_ms)

    response = _http_post_with_retry(
        f"{url}/send/text",
        json_data={"number": phone, "text": text, "delay": delay_ms},
        headers={"Content-Type": "application/json", "token": token}
    )

    if response is None:
        return False

    if response.status_code == 200:
        return True
    else:
        logger.warning(f"UAZAPI send failed ({response.status_code}): {response.text[:100]}")
        return False


def get_saudacao_by_hour(hour: int) -> str:
    """Retorna saudação baseada na hora (sem depender de message_variations)."""
    if 5 <= hour < 12:
        return random.choice(["Bom dia", "Bom diaa", "Bom dia!"])
    elif 12 <= hour < 18:
        return random.choice(["Boa tarde", "Boa tardee", "Boa tarde!"])
    else:
        return random.choice(["Boa noite", "Boa noitee", "Boa noite!"])


# ===============================================================
# ANTI-BAN: Lógica de alternância de dias
# ===============================================================

def is_dispatch_day(metadata: dict) -> bool:
    """Verifica se hoje é dia de disparo baseado no padrão active/pause."""
    active_days = metadata.get('active_days', 2)
    pause_days = metadata.get('pause_days', 1)
    randomize = metadata.get('randomize_pattern', False)
    cycle_start = metadata.get('cycle_start_date')

    if not cycle_start:
        logger.info(f"[ANTI-BAN] cycle_start_date NAO configurado -> SEMPRE ATIVO")
        return True

    try:
        start_date = datetime.strptime(cycle_start, '%Y-%m-%d').date()
    except (ValueError, TypeError) as e:
        logger.info(f"[ANTI-BAN] cycle_start_date INVALIDO ('{cycle_start}'): {e} -> SEMPRE ATIVO")
        return True

    today = get_now_br().date()
    days_since_start = (today - start_date).days

    logger.info(f"[ANTI-BAN] Ciclo iniciou em {start_date}, hoje={today}, dias desde inicio={days_since_start}")
    logger.info(f"[ANTI-BAN] Config: active_days={active_days}, pause_days={pause_days}, randomize={randomize}")

    if days_since_start < 0:
        return True

    if randomize:
        random.seed(days_since_start // (active_days + pause_days))
        active_days = max(1, active_days + random.choice([-1, 0, 0, 1]))
        pause_days = max(1, pause_days + random.choice([0, 0, 1]))

    cycle_length = active_days + pause_days
    day_in_cycle = days_since_start % cycle_length
    is_active = day_in_cycle < active_days

    logger.info(f"[ANTI-BAN] day_in_cycle={day_in_cycle}/{cycle_length} -> {'ATIVO' if is_active else 'PAUSA'}")
    return is_active


# ===============================================================
# JOB PRINCIPAL
# ===============================================================

def process_dispatch_for_settings(settings: dict) -> None:
    """
    Processa disparo para uma configuração específica.
    BATCH ROUND-ROBIN: Fatia leads em lotes do tamanho das instâncias.
    Dados SEMPRE buscados FRESCOS do banco.
    """
    # === VARIÁVEIS IMUTÁVEIS (nunca sobrescrever) ===
    agency_id = settings.get('agency_id')        # Para update_progress (NUNCA mudar)
    settings_id = settings.get('id')
    prefix_log = f"[agency={agency_id or 'GLOBAL'}]"
    sent_count = 0
    invalid_count = 0
    attempted_count = 0

    logger.info(f"")
    logger.info(f"{'='*60}")
    logger.info(f"[SDR] INICIANDO DISPARO {prefix_log}")
    logger.info(f"[SDR] settings_id={settings_id}, agency_id={agency_id}")
    logger.info(f"{'='*60}")

    try:
        # === PASSO 1: Buscar config FRESCA do banco ===
        update_progress("message_dispatch", agency_id, "Carregando configuração...", 5)
        logger.info(f"[SDR] Barra -> 5% (agency_id={agency_id})")

        fresh_response = supabase.table("automation_settings") \
            .select("*") \
            .eq("id", settings_id) \
            .single() \
            .execute()

        if not fresh_response.data:
            logger.error(f"[SDR] ABORT: Config id={settings_id} nao existe no DB. Deletada?")
            update_progress("message_dispatch", agency_id, "Config não encontrada", 0)
            return

        metadata = fresh_response.data.get('metadata', {})
        logger.info(f"[SDR] Config fresca OK. Metadata keys: {list(metadata.keys())}")

        # === PASSO 1b: COOLDOWN ANTI-BAN (persistido no banco) ===
        cooldown_until_str = metadata.get('cooldown_until')
        if cooldown_until_str:
            try:
                cooldown_until = datetime.fromisoformat(cooldown_until_str)
                now_check = get_now_br()
                if cooldown_until > now_check:
                    remaining_secs = int((cooldown_until - now_check).total_seconds())
                    logger.info(f"[SDR] Em cooldown anti-ban ate {cooldown_until.strftime('%H:%M:%S')} ({remaining_secs}s restantes). Abortando ciclo.")
                    update_progress("message_dispatch", agency_id, f"Cooldown anti-ban ({remaining_secs}s restantes)", 0)
                    return
                else:
                    logger.info(f"[SDR] Cooldown expirado ({cooldown_until_str}). Prosseguindo.")
            except (ValueError, TypeError) as e:
                logger.warning(f"[SDR] cooldown_until invalido ('{cooldown_until_str}'): {e}. Ignorando.")

        # === PASSO 2: Verificar horário (INDEPENDENTE — lê do próprio metadata) ===
        update_progress("message_dispatch", agency_id, "Verificando expediente...", 8)
        logger.info(f"[SDR] Barra -> 8% (agency_id={agency_id})")

        dispatch_start = metadata.get('start_time', '08:00')
        dispatch_end = metadata.get('end_time', '18:00')
        now_br = get_now_br()
        current_time_str = now_br.strftime("%H:%M")
        is_within = dispatch_start <= current_time_str <= dispatch_end

        if not is_within:
            logger.info(f"[SDR] ABORT: Fora do expediente ({current_time_str}, janela {dispatch_start}-{dispatch_end})")
            update_progress("message_dispatch", agency_id, f"Fora do expediente ({dispatch_start}-{dispatch_end})", 0)
            return

        logger.info(f"[SDR] Dentro do expediente ({current_time_str}, janela {dispatch_start}-{dispatch_end})")

        # === PASSO 3: Anti-ban ===
        if not is_dispatch_day(metadata):
            logger.info(f"[SDR] ABORT: Dia de pausa (anti-ban)")
            update_progress("message_dispatch", agency_id, "Dia de pausa (anti-ban)", 0)
            log_to_db(level="INFO", message="DISPARO PAUSADO: Dia de pausa.", agency_id=agency_id, category="DISPAROS")
            return

        # === PASSO 4: Ler configuracoes de disparo ===
        config_batch_size = metadata.get('limite_disparos', 1)
        daily_limit = metadata.get('daily_limit') or metadata.get('max_per_day') or 0
        if daily_limit:
            daily_limit = int(daily_limit)
        logger.info(f"[SDR] Limites: batch={config_batch_size}, daily_limit={daily_limit}")
        delay_minimo = metadata.get('delay_minimo', 5)
        delay_maximo = metadata.get('delay_maximo', 12)
        prefix = metadata.get('prefix', '')

        # === SPINTAX: Ler variantes com fallback para campos legados (Msg 1 e 2 apenas) ===
        msg1_variants = metadata.get('mensagem_1_variants') or ([metadata['mensagem_1']] if metadata.get('mensagem_1') else [])
        msg2_variants = metadata.get('mensagem_2_variants') or ([metadata['mensagem_2']] if metadata.get('mensagem_2') else [])
        logger.info(f"[SDR] Variantes: msg1={len(msg1_variants)}, msg2={len(msg2_variants)}")

        # =============================================================
        # PASSO 5: Carregar instancias UAZAPI (FRESCO do banco)
        # =============================================================
        instances_raw = metadata.get('uazapi_instances', [])
        logger.info(f"[SDR] Instancias encontradas no JSON: {len(instances_raw)}")

        if not instances_raw:
            legacy_url = metadata.get('uazapi_url')
            legacy_token = metadata.get('uazapi_token')
            if legacy_url and legacy_token:
                logger.warning(f"[SDR] Array uazapi_instances VAZIO -- usando fallback legado")
                instances_raw = [{'name': 'Legado', 'url': legacy_url, 'token': legacy_token}]
            else:
                logger.error(f"[SDR] ABORT: Nenhuma instancia no array E nenhum fallback legado")
                update_progress("message_dispatch", agency_id, "Sem instancia UAZAPI", 0)
                return

        valid_instances = [i for i in instances_raw if i.get('url') and i.get('token') and i.get('is_active', True)]

        if not valid_instances:
            logger.error(f"[SDR] ABORT: Instancias existem mas nenhuma tem url+token validos ou esta ativa")
            update_progress("message_dispatch", agency_id, "Instancias UAZAPI invalidas ou pausadas", 0)
            return

        logger.info(f"[SDR] {len(instances_raw)} instancias no JSON | {len(valid_instances)} ativas e validas para este ciclo.")
        for vi_idx, vi in enumerate(valid_instances):
            logger.info(f"   [{vi_idx}] name='{vi.get('name')}' table='{vi.get('table_name', '???')}' url='{vi.get('url')}'")

        # =============================================================
        # PASSO 6: ITERACAO POR INSTANCIA (Nova Busca Descentralizada)
        # Cada instancia tem sua propria tabela. Limite diario POR tabela.
        # Busca 1 lead por instancia (fila indiana).
        # =============================================================
        update_progress("message_dispatch", agency_id, "Buscando leads por instancia...", 10)

        today_start = now_br.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        leads_com_instancia = []  # Lista de tuplas (lead, instancia, tabela_alvo)

        for instancia in valid_instances:
            tabela_alvo = instancia.get('table_name', '').strip()
            inst_name = instancia.get('name', 'Padrao')

            if not tabela_alvo:
                logger.warning(f"[SDR] Instancia '{inst_name}' sem table_name. Pulando.")
                update_instance_progress("message_dispatch", agency_id, inst_name, "Sem tabela vinculada", 0)
                continue

            # --- Limite diario POR tabela/instancia ---
            if daily_limit and daily_limit > 0:
                try:
                    sent_today_count = 0
                    for sent_status in ['Enviado', 'msg1_sent', 'msg2_sent', 'Erro', 'Processando']:
                        resp = supabase.table(tabela_alvo) \
                            .select("id", count="exact") \
                            .eq("stats", sent_status) \
                            .gte("horario_disparo", today_start) \
                            .execute()
                        sent_today_count += (resp.count or 0)
                except Exception as e:
                    logger.warning(f"[SDR] Falha ao contar envios de hoje em {tabela_alvo}: {e}. Assumindo 0.")
                    sent_today_count = 0

                saldo_inst = daily_limit - sent_today_count  # type: ignore[operator]
                logger.info(f"[SDR] [{inst_name}] SALDO DIARIO: {sent_today_count}/{daily_limit} em '{tabela_alvo}'. Restam {saldo_inst}.")

                if saldo_inst <= 0:
                    logger.info(f"[SDR] Instancia '{inst_name}' atingiu limite diario ({daily_limit}). Pulando.")
                    update_instance_progress("message_dispatch", agency_id, inst_name, f"Limite diario atingido ({sent_today_count}/{daily_limit})", 100)
                    continue

            # --- Buscar 1 lead nesta tabela (fila indiana) ---
            try:
                leads_response = supabase.table(tabela_alvo) \
                    .select('*') \
                    .or_('stats.eq.Aguardando,stats.eq.Erro') \
                    .order('created_at') \
                    .limit(5) \
                    .execute()
            except Exception as e:
                logger.error(f"[SDR] Erro ao buscar leads em '{tabela_alvo}' ({inst_name}): {e}")
                update_instance_progress("message_dispatch", agency_id, inst_name, f"Erro: {e}", 0)
                continue

            raw_leads = leads_response.data or []

            # --- Quarentena de erro: ignorar leads com status 'Erro' de HOJE ---
            lead_escolhido = None
            for candidate in raw_leads:
                if candidate.get('stats') == 'Erro':
                    horario_str = candidate.get('horario_disparo', '')
                    if horario_str:
                        try:
                            horario_dt = datetime.fromisoformat(horario_str)
                            if horario_dt.date() == now_br.date():
                                logger.info(f"[SDR] Lead {candidate.get('id')} em quarentena (Erro de hoje). Pulando.")
                                continue
                        except (ValueError, TypeError):
                            pass
                lead_escolhido = candidate
                break

            if not lead_escolhido:
                logger.info(f"[SDR] [{inst_name}] 0 leads disponiveis em '{tabela_alvo}' (apos quarentena)")
                update_instance_progress("message_dispatch", agency_id, inst_name, f"Tabela '{tabela_alvo}' VAZIA! Adicione mais contatos.", 100)
                log_to_db(level="WARNING", message=f"Fila Vazia: A instancia '{inst_name}' ficou sem contatos na tabela '{tabela_alvo}'.", agency_id=agency_id, category="DISPAROS")
                continue

            # --- Anti-duplo: marcar como 'Processando' imediatamente ---
            try:
                supabase.table(tabela_alvo).update({  # type: ignore[union-attr]
                    'stats': 'Processando'
                }).eq('id', lead_escolhido['id']).execute()  # type: ignore[union-attr]
                logger.info(f"[SDR] Lead {lead_escolhido['id']} marcado 'Processando' em '{tabela_alvo}'")
            except Exception as e:
                logger.error(f"[SDR] Falha ao marcar Processando em '{tabela_alvo}': {e}")

            leads_com_instancia.append((lead_escolhido, instancia, tabela_alvo))
            logger.info(f"[SDR] [{inst_name}] Lead {lead_escolhido.get('id')} capturado de '{tabela_alvo}'")  # type: ignore[union-attr]

        # =============================================================
        # CHECK: Se nenhuma instancia trouxe leads, campanha concluida
        # =============================================================
        if not leads_com_instancia:
            logger.info(f"[SDR] ABORT: 0 leads capturados em todas as instancias")
            update_progress("message_dispatch", agency_id, "Sem leads pendentes em nenhuma instancia", 100)
            reset_instance_progress("message_dispatch", agency_id)
            return

        logger.info(f"[SDR] {len(leads_com_instancia)} leads capturados de {len(leads_com_instancia)} instancias")
        update_progress("message_dispatch", agency_id, f"{len(leads_com_instancia)} leads capturados", 20)

        # === PASSO 7: Resolver agency_id para vincular clients ===
        client_agency_id = agency_id  # Separado: so para client records
        if not client_agency_id:
            try:
                admin_resp = supabase.table('profiles') \
                    .select('id, agency_id') \
                    .eq('prefix', prefix) \
                    .eq('role', 'admin') \
                    .limit(1) \
                    .execute()
                if admin_resp.data:
                    client_agency_id = admin_resp.data[0].get('agency_id') or admin_resp.data[0].get('id')
            except Exception:
                pass

        # =======================================================
        # PASSO 8: DISPARO PARALELO (ThreadPoolExecutor)
        # Cada thread processa 1 lead com sua instancia exclusiva.
        # =======================================================
        leads = [item[0] for item in leads_com_instancia]

        # COUNT total pendentes (agregando TODAS as tabelas) para barra global
        total_pending = 0
        instance_tables = set(item[2] for item in leads_com_instancia)
        for tbl in instance_tables:
            try:
                cnt_resp = supabase.table(tbl).select('id', count='exact').or_('stats.eq.Aguardando,stats.eq.Erro').execute()
                total_pending += (cnt_resp.count or 0)
            except Exception:
                pass
        total_pending += len(leads)  # Inclui os que acabamos de marcar como 'Processando'

        if total_pending == 0:
            total_pending = len(leads)

        logger.info(f"[SDR] Total pendentes (todas as tabelas): {total_pending}")

        # Progresso global: cada lead pesa 100/total_pending da campanha inteira
        peso_lead_global = 100.0 / total_pending if total_pending > 0 else 100.0
        already_processed = max(0, total_pending - len(leads))

        def _process_single_lead(lead: dict, instancia: dict, global_idx: int, tabela_alvo: str, n8n_chat_val: str | None = None) -> str:  # type: ignore[return]
            """
            Processa UM lead com UMA instancia na sua tabela exclusiva.
            Retorna: 'sent', 'invalid', ou 'error'
            """
            lead_name_raw = lead.get('name', 'Lead')
            lead_phone_raw = lead.get('phone', '')
            lead_id = lead.get('id')
            url_api = instancia['url']
            inst_token = instancia['token']
            inst_name = instancia.get('name', 'Padrao')

            # First-name capitalizado
            first_name = lead_name_raw.strip().split()[0].title() if lead_name_raw and lead_name_raw.strip() else 'Amigo'

            # Progresso global: base = leads já processados na campanha inteira
            leads_done_before = already_processed + global_idx
            base_pct = leads_done_before * peso_lead_global

            def _step(frac: float, text: str):
                """Micro-passo: atualiza barra da instância."""
                pct = int(base_pct + peso_lead_global * frac)
                update_instance_progress("message_dispatch", agency_id, inst_name, text, min(pct, 99))

            # Flag de segurança: garante que o lead NUNCA fique como 'Aguardando'
            status_updated = False

            try:
                # === INSTANCE LOCK: Adquirir antes de processar ===
                with _instance_lock:
                    if inst_name in _active_instances:
                        logger.warning(f"[SDR] [LOCK] Instancia '{inst_name}' OCUPADA -- pulando lead {lead_id} ({first_name})")
                        return 'skipped'
                    _active_instances.add(inst_name)
                logger.info(f"[SDR] [LOCK] Instancia '{inst_name}' ADQUIRIDA para lead {lead_id}")

                _step(0.10, f"Buscando {first_name}...")
                # Log de reprocessamento para leads que falharam anteriormente
                if lead.get('stats') == 'Erro':
                    logger.info(f"[SDR] [RETRY] Reprocessando lead {lead_id} ({first_name}) que falhou anteriormente")
                logger.info(f"[SDR] [{global_idx+1}/{len(leads)}] {first_name} -> {inst_name} (THREAD)")

                # a. Formatar telefone
                formatted_phone = format_phone(lead_phone_raw)
                if not formatted_phone:
                    logger.warning(f"[SDR] Telefone inválido: {first_name} ({lead_phone_raw})")
                    status_updated = _mark_lead_status(tabela_alvo, lead_id, 'Invalido')
                    return 'invalid'

                # b. Verificar WhatsApp
                _step(0.20, f"Validando WhatsApp de {first_name}...")
                try:
                    exists = check_whatsapp_number(url_api, inst_token, formatted_phone)
                except Exception as wa_err:
                    # Erro de API/conexão — NÃO marcar como Invalido!
                    logger.error(f"[SDR] [API_ERROR] Falha ao verificar WhatsApp de {first_name}: {wa_err}")
                    update_instance_progress("message_dispatch", agency_id, inst_name, f"[!] Erro API: {first_name} — WhatsApp desconectado?", min(int(base_pct + peso_lead_global * 0.90), 99))
                    time.sleep(3)
                    status_updated = _mark_lead_status(tabela_alvo, lead_id, 'Erro')
                    return 'error'

                if not exists:
                    logger.info(f"[SDR] {first_name} ({formatted_phone}) — não no WhatsApp")
                    update_instance_progress("message_dispatch", agency_id, inst_name, f"[X] {first_name} nao possui WhatsApp", min(int(base_pct + peso_lead_global * 0.90), 99))
                    time.sleep(3)
                    status_updated = _mark_lead_status(tabela_alvo, lead_id, 'Invalido')
                    return 'invalid'

                # c. Gerar variável {saudacao} (disponível para uso nos templates Msg 1/2)
                saudacao = get_saudacao_by_hour(get_now_br().hour)

                # d. Criar registro (clients + chat_messages)
                _step(0.30, f"Preparando envio para {first_name}...")
                conversation_id = str(uuid.uuid4())
                client_id = _create_client_record(
                    phone=formatted_phone,
                    name=lead_name_raw,
                    conversation_id=conversation_id,
                    prefix=prefix,
                    agency_id=client_agency_id,
                    instance_name=inst_name,
                    url_api=url_api,
                    instance_token=inst_token,
                    n8n_chat=n8n_chat_val
                )

                # e. ENVIO SEQUENCIAL HUMANIZADO: Msg 1 -> Msg 2 (sem saudação isolada)
                # SPINTAX: Sortear variantes para cada slot de mensagem (apenas Msg 1 e 2)
                custom_messages = []
                for variants in [msg1_variants, msg2_variants]:
                    if variants and any(v.strip() for v in variants):
                        valid = [v for v in variants if v.strip()]
                        custom_messages.append(random.choice(valid))

                if not custom_messages:
                    logger.warning(f"[SDR] Nenhuma mensagem configurada para {first_name}. Pulando.")
                    status_updated = _mark_lead_status(tabela_alvo, lead_id, 'Erro')
                    return 'error'

                msg_fracs = [0.40, 0.60, 0.75, 0.90]
                for msg_idx, msg_text in enumerate(custom_messages):
                    try:
                        raw_inst_name = instancia.get('name', 'Consultor')
                        instance_display_name = raw_inst_name.strip().split()[0].title() if raw_inst_name and raw_inst_name.strip() else 'Consultor'
                        msg_text = msg_text.replace('{nome}', first_name).replace('{nome_ia}', instance_display_name).replace('{nome_instancia}', instance_display_name).replace('{saudacao}', saudacao)
                    except (KeyError, IndexError):
                        pass

                    frac_dig = msg_fracs[msg_idx * 2] if msg_idx * 2 < len(msg_fracs) else 0.90
                    frac_send = msg_fracs[msg_idx * 2 + 1] if msg_idx * 2 + 1 < len(msg_fracs) else 0.95

                    _step(frac_dig, f"Digitando Msg {msg_idx+1} para {first_name}...")
                    logger.info(f"[SDR] Msg_{msg_idx+1} -> {first_name} via {inst_name}")
                    _step(frac_send, f"Enviando Msg {msg_idx+1}...")

                    # RETRY COM BACKOFF: 1 tentativa extra antes de desistir
                    send_ok = send_message_humanized(url_api, inst_token, formatted_phone, msg_text)
                    if not send_ok:
                        logger.warning(f"[SDR] [RETRY] Msg_{msg_idx+1} falhou para {first_name} -- tentando novamente em 3s")
                        time.sleep(3)
                        send_ok = send_message_humanized(url_api, inst_token, formatted_phone, msg_text)

                    if send_ok:
                        logger.info(f"[SDR] [OK] Msg_{msg_idx+1} enviada com SUCESSO para {first_name} via {inst_name}")
                        _save_chat_message(
                            conversation_id=conversation_id,
                            phone=formatted_phone,
                            name=lead_name_raw,
                            client_id=client_id,
                            prefix=prefix,
                            message=msg_text
                        )
                    else:
                        logger.warning(f"[SDR] [FAIL] Msg_{msg_idx+1} FALHOU (apos retry) para {first_name} via {inst_name}")
                        update_instance_progress("message_dispatch", agency_id, inst_name, f"[X] Falha UAZAPI Msg {msg_idx+1} para {first_name}", min(int(base_pct + peso_lead_global * 0.90), 99))
                        time.sleep(3)

                # f. Marcar como Enviado
                status_updated = _mark_lead_status(tabela_alvo, lead_id, 'Enviado')
                done_pct = int((leads_done_before + 1) * peso_lead_global)
                logger.info(f"[SDR] {first_name} ({formatted_phone}) -- Completo via {inst_name}!")
                update_instance_progress("message_dispatch", agency_id, inst_name, f"[OK] {first_name} concluido", min(done_pct, 100))
                return 'sent'

            except Exception as e:
                logger.error(f"[SDR] Excecao na thread ({first_name}, lead_id={lead_id}): {e}", exc_info=True)
                try:
                    status_updated = _mark_lead_status(tabela_alvo, lead_id, 'Erro')
                except Exception:
                    pass  # finally cuidará
                return 'error'
            finally:
                # === INSTANCE LOCK: Liberar SEMPRE ===
                with _instance_lock:
                    _active_instances.discard(inst_name)
                logger.info(f"[SDR] [LOCK] Instancia '{inst_name}' LIBERADA")
                # GARANTIA ABSOLUTA: se o lead foi tocado mas status NAO foi atualizado,
                # marca como 'Erro' para NUNCA repetir
                if not status_updated and lead_id is not None:
                    logger.warning(f"[SDR] Lead {lead_id} saiu sem status! Marcando como 'Erro'")
                    try:
                        _mark_lead_status(tabela_alvo, lead_id, 'Erro')
                    except Exception as final_err:
                        logger.error(f"[SDR] FALHA TOTAL ao marcar lead {lead_id} como Erro no finally: {final_err}")

        # === DISPARO PARALELO (1 lead por instancia) ===
        logger.info(f"")
        logger.info(f"[SDR] == DISPARO PARALELO: {len(leads_com_instancia)} leads em {len(leads_com_instancia)} instancias ==")
        update_progress("message_dispatch", agency_id, f"Disparando {len(leads_com_instancia)} leads...", 30)

        # Montar tasks com tabela_alvo
        tasks = []
        for idx, (lead, instancia, tabela_alvo) in enumerate(leads_com_instancia):
            n8n_chat_val = instancia.get('n8n_chat') or None
            tasks.append((lead, instancia, idx, tabela_alvo, n8n_chat_val))
            attempted_count += 1

        # Disparar TODAS as threads simultaneamente
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(tasks)) as executor:
            futures = {
                executor.submit(_process_single_lead, lead, inst, gidx, tbl, n8n): (lead, inst, tbl)  # type: ignore[arg-type]
                for lead, inst, gidx, tbl, n8n in tasks
            }

            for future in concurrent.futures.as_completed(futures):
                try:
                    result = future.result()
                    if result == 'sent':
                        sent_count += 1  # type: ignore[operator]
                    elif result == 'invalid':
                        invalid_count += 1  # type: ignore[operator]
                    elif result == 'skipped':
                        # Instancia estava ocupada -- devolver lead pra fila
                        lead_data, _, tbl_alvo = futures[future]
                        skip_id = lead_data.get('id')
                        if skip_id:
                            try:
                                _mark_lead_status(tbl_alvo, skip_id, 'Aguardando')
                            except Exception:
                                pass
                        logger.info(f"[SDR] Lead {skip_id} devolvido a fila (instancia ocupada)")
                except Exception as thread_err:
                    logger.error(f"[SDR] Erro em thread de envio: {thread_err}", exc_info=True)

        logger.info(f"[SDR] Disparo finalizado. {sent_count} enviados, {invalid_count} invalidos")

        # === RESUMO DO CICLO ===
        summary = f"Ciclo finalizado: {attempted_count} tentados | {sent_count} enviados | {invalid_count} invalidos"
        logger.info(f"[SDR] {summary}")

        if attempted_count > 0:
            log_to_db(level="INFO", message=summary, agency_id=client_agency_id, category="DISPAROS")

        # === COOLDOWN POS-CICLO: Aplicar delay anti-ban para o proximo ciclo ===
        if sent_count > 0:
            delay_minutes = random.randint(delay_minimo, delay_maximo)
            next_run = get_now_br() + timedelta(minutes=delay_minutes)
            next_run_iso = next_run.isoformat()
            logger.info(f"[SDR] Cooldown pos-ciclo aplicado: {delay_minutes} min. Proximo disparo em: {next_run.strftime('%H:%M:%S')}")
            try:
                updated_meta = {**metadata, 'cooldown_until': next_run_iso}
                supabase.table('automation_settings') \
                    .update({'metadata': updated_meta}) \
                    .eq('id', settings_id) \
                    .execute()
            except Exception as cd_err:
                logger.error(f"[SDR] Falha ao gravar cooldown pos-ciclo: {cd_err}")

        # === VERIFICAR SE CAMPANHA TERMINOU (COUNT pendentes em TODAS as tabelas) ===
        remaining = 0
        for tbl in instance_tables:
            try:
                rem_resp = supabase.table(tbl) \
                    .select('id', count='exact') \
                    .or_('stats.eq.Aguardando,stats.eq.Erro') \
                    .execute()
                remaining += (rem_resp.count or 0)
            except Exception:
                pass

        if remaining == 0:
            # Campanha 100% concluida -- zerar tudo
            logger.info(f"[SDR] Campanha CONCLUIDA (0 leads pendentes em todas as tabelas)")
            for vi in valid_instances:
                update_instance_progress("message_dispatch", agency_id, vi.get('name', 'Padrao'), "[DONE] Campanha concluida", 100)
            update_progress("message_dispatch", agency_id, f"Campanha concluida: {sent_count} enviados", 100)
            time.sleep(5)
            reset_instance_progress("message_dispatch", agency_id)
            update_progress("message_dispatch", agency_id, "Campanha finalizada -- 0 pendentes", 100)
        else:
            # Ainda ha leads -- manter barras no percentual atual
            cycle_pct = int(((total_pending - remaining) / total_pending) * 100) if total_pending > 0 else 0
            logger.info(f"[SDR] Ciclo concluido. Restam {remaining} leads ({cycle_pct}% da campanha)")
            for vi in valid_instances:
                update_instance_progress("message_dispatch", agency_id, vi.get('name', 'Padrao'), f"Aguardando proximo ciclo... ({remaining} restantes)", cycle_pct)
            update_progress("message_dispatch", agency_id, f"Ciclo concluido -- {remaining} leads restantes", cycle_pct)

    except Exception as e:
        logger.error(f"[SDR] ERRO CRITICO (settings_id={settings_id}): {e}", exc_info=True)
        logger.info(f"[SDR] Barra -> RESET POR ERRO (agency_id={agency_id})")
        reset_instance_progress("message_dispatch", agency_id)
        update_progress("message_dispatch", agency_id, "Erro — aguardando próximo ciclo", 0)


def message_dispatch_job() -> None:
    """
    Job principal de disparo de mensagens.
    Chamado pelo APScheduler a cada X minutos.
    Busca configurações FRESCAS do banco a cada execução.
    """
    logger.info("=== DISPARO: Iniciando ciclo global ===")



    try:
        # Fix #2: Buscar configs FRESCAS do banco a cada execução
        response = supabase.table("automation_settings") \
            .select("*") \
            .eq("name", "message_dispatch") \
            .eq("automation_status", "RUNNING") \
            .execute()

        all_settings = response.data or []

        if not all_settings:
            logger.info(f"[SDR] Nenhuma config com status RUNNING")
            return

        logger.info(f"[SDR] {len(all_settings)} configuracoes RUNNING encontradas")
        for s in all_settings:
            logger.info(f"   -> id={s.get('id')}, agency_id={s.get('agency_id')}")

        for settings in all_settings:
            process_dispatch_for_settings(settings)

    except Exception as e:
        logger.error(f"[SDR] ERRO CRITICO no loop principal: {e}", exc_info=True)


# ===============================================================
# HELPERS INTERNOS
# ===============================================================

def _mark_lead_status(table: str, lead_id, status: str) -> bool:
    """Atualiza status de um lead na tabela de disparos. Retorna True se deu certo."""
    if lead_id is None:
        logger.error(f"[STATUS] lead_id e None! Impossivel atualizar para '{status}'")
        return False
    try:
        resp = supabase.table(table).update({
            'stats': status,
            'horario_disparo': get_now_br().isoformat()
        }).eq('id', lead_id).execute()
        updated = len(resp.data) if resp.data else 0
        if updated == 0:
            logger.error(f"[STATUS] UPDATE retornou 0 rows! lead_id={lead_id}, status={status}")
            return False
        logger.info(f"[STATUS] Lead {lead_id} -> '{status}' (rows={updated})")
        return True
    except Exception as e:
        logger.error(f"[STATUS] Excecao ao marcar lead {lead_id}: {e}", exc_info=True)
        return False


def _create_client_record(
    phone: str,
    name: str,
    conversation_id: str,
    prefix: str,
    agency_id: str | None,
    instance_name: str,
    url_api: str,
    instance_token: str,
    n8n_chat: str | None = None
) -> str | None:
    """Cria registro do cliente na tabela clients."""
    try:
        now = get_now_br().isoformat()
        client_data = {
            'phone': phone,
            'name': name,
            'conversation_id': conversation_id,
            'prefix': prefix,
            'ia_service': 'active',
            'created_at': now,
            'last_interaction': now,
            'followUp': '0',
            'url_api': url_api,
            'intance_token': instance_token,  # Mantém o typo do schema original
            'instance_name': instance_name,
        }

        if agency_id:
            client_data['agency_id'] = agency_id

        if n8n_chat:
            client_data['n8n_chat'] = n8n_chat

        response = supabase.table('clients').insert(client_data).execute()
        if response.data:
            return response.data[0].get('id')
    except Exception as e:
        logger.error(f"Erro ao criar cliente {name}: {e}")
    return None


def _save_chat_message(
    conversation_id: str,
    phone: str,
    name: str,
    client_id: str | None,
    prefix: str,
    message: str
) -> None:
    """Salva mensagem enviada na tabela chat_messages."""
    try:
        now = get_now_br().isoformat()
        supabase.table('chat_messages').insert({
            'bot_message': message,
            'conversation_id': conversation_id,
            'phone': phone,
            'nomewpp': name,
            'client_id': client_id,
            'prefix': prefix,
            'created_at': now,
            'updated_at': now
        }).execute()
    except Exception as e:
        logger.error(f"Erro ao salvar chat_message: {e}")
