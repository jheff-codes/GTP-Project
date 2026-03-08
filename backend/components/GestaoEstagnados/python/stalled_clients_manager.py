"""
Sistema de Redistribuição de Clientes Represados — v2
Grace Period + Round-Robin Justo + Notificação UAZAPI + Horário Independente.

Fluxo:
  1. Busca leads represados agrupados por agência
  2. Verifica horário de operação (metadata start_time ou distribution_time)
  3. Grace Period: Espera X minutos após corretores ficarem online
  4. Distribui leads 1-a-1 com Round-Robin justo (last_lead_received)
  5. Notifica cada corretor via WhatsApp (UAZAPI)
"""

import logging
import httpx
from datetime import datetime
from typing import Dict, List
from database import supabase, log_to_db, get_automation_settings, get_now_br, update_progress

logger = logging.getLogger("PythonEngine")

# Controle de última execução por agência (em memória)
last_runs = {}

# Template padrão de notificação WhatsApp (fallback)
_FALLBACK_WHATSAPP_PROMPT = """*NOVO LEAD CHEGOU*

{saudacao}, {broker_name}! O sistema acabou de selecionar um cliente para voce.

*Nome:* {lead_name}
*Telefone:* +{lead_phone}

Voce pode acompanhar a conversa pelo sistema, ou pausar a IA para voce atender!"""


def _get_saudacao() -> str:
    hora = get_now_br().hour
    if 5 <= hora < 12:
        return "Bom dia"
    elif 12 <= hora < 18:
        return "Boa tarde"
    return "Boa noite"


def send_whatsapp_notification(
    metadata: dict,
    broker_name: str,
    broker_phone: str,
    lead_name: str,
    lead_phone: str,
    agency_id: str
) -> None:
    """Envia notificação WhatsApp ao corretor via UAZAPI (fire-and-forget)."""
    if not metadata.get("whatsapp_notification_enabled"):
        return

    url = metadata.get("uazapi_url", "").rstrip("/")
    token = metadata.get("uazapi_token", "")

    if not url or not token:
        logger.warning("UAZAPI: Credenciais incompletas, notificação ignorada.")
        return

    prompt_template = metadata.get("whatsapp_notification_prompt") or _FALLBACK_WHATSAPP_PROMPT

    try:
        first_name = broker_name.split(" ")[0] if broker_name else "Parceiro"
        message = prompt_template.replace("{saudacao}", _get_saudacao()) \
                                 .replace("{broker_name}", first_name) \
                                 .replace("{lead_name}", lead_name or "Cliente") \
                                 .replace("{lead_phone}", lead_phone or "")

        clean_phone = "".join(c for c in (broker_phone or "") if c.isdigit())
        if not clean_phone:
            logger.warning(f"UAZAPI: Corretor {broker_name} sem telefone cadastrado.")
            return

        endpoint = f"{url}/send/text"
        payload = {"number": clean_phone, "text": message}
        headers = {"Content-Type": "application/json", "token": token}

        with httpx.Client(timeout=10) as client:
            resp = client.post(endpoint, json=payload, headers=headers)

        if resp.status_code in (200, 201):
            logger.info(f"UAZAPI: Notificação enviada para {first_name} ({clean_phone})")
            log_to_db("SUCCESS", f"WhatsApp enviado para {broker_name} sobre lead {lead_name}.", agency_id, category="NOTIF")
        else:
            logger.error(f"UAZAPI: Falha {resp.status_code} - {resp.text[:200]}")
            log_to_db("ERROR", f"UAZAPI FALHA ({resp.status_code}): Notificação para {broker_name} falhou.", agency_id)

    except Exception as e:
        logger.error(f"UAZAPI: Exceção ao enviar notificação: {e}")
        log_to_db("ERROR", f"UAZAPI ERRO: {str(e)[:200]}", agency_id)


# ===============================================================
# GRACE PERIOD HELPERS
# ===============================================================

def _save_grace_period_start(settings_id: str, metadata: dict) -> None:
    """Persiste grace_period_start no metadata do banco."""
    now_iso = get_now_br().isoformat()
    metadata['grace_period_start'] = now_iso
    try:
        supabase.table("automation_settings").update({
            'metadata': metadata
        }).eq('id', settings_id).execute()
        logger.info(f"[GRACE] grace_period_start gravado: {now_iso}")
    except Exception as e:
        logger.error(f"[GRACE] Falha ao gravar grace_period_start: {e}")


def _clear_grace_period_start(settings_id: str, metadata: dict) -> None:
    """Remove grace_period_start do metadata do banco."""
    metadata.pop('grace_period_start', None)
    try:
        supabase.table("automation_settings").update({
            'metadata': metadata
        }).eq('id', settings_id).execute()
        logger.info("[GRACE] grace_period_start LIMPO")
    except Exception as e:
        logger.error(f"[GRACE] Falha ao limpar grace_period_start: {e}")


# ===============================================================
# JOB PRINCIPAL
# ===============================================================

def manage_stalled_clients_job() -> None:
    """
    Job principal para redistribuir clientes represados.
    Grace Period + Round-Robin justo + Notificação UAZAPI.
    """
    try:
        now_br = get_now_br()
        current_time_str = now_br.strftime("%H:%M")

        # 1. Buscar TODOS os leads represados
        stalled_response = supabase.table("clientes_represados").select("*").execute()
        stalled_leads = stalled_response.data or []

        if not stalled_leads:
            logger.info("[REDIST] ABORT: 0 leads represados encontrados. Nada a fazer.")
            update_progress("stalled_clients_distribution", None, "Nenhum lead represado", 0)
            return

        # 2. Agrupar por agência
        leads_by_agency: Dict[str, List[dict]] = {}
        for lead in stalled_leads:
            aid = lead.get('agency_id')
            prefix = lead.get('prefix')
            key = aid if aid else prefix
            if key not in leads_by_agency:
                leads_by_agency[key] = []
            leads_by_agency[key].append(lead)

        total_agencies = len(leads_by_agency)
        processed: int = 0

        for key, leads in leads_by_agency.items():
            actual_agency_id = key

            # Resolver prefix -> UUID real da agencia
            if isinstance(key, str) and len(key) < 15:
                profile_resp = supabase.table("profiles") \
                    .select("agency_id, id") \
                    .eq("prefix", key) \
                    .limit(1).execute()
                if profile_resp.data:
                    p = profile_resp.data[0]
                    actual_agency_id = p.get('agency_id') or p.get('id')
                    logger.info(f"ROBÔ: Prefixo '{key}' -> Agência UUID: {actual_agency_id}")

            # 3. Buscar settings FRESCAS do banco
            settings = get_automation_settings("stalled_clients_distribution", actual_agency_id)
            if not settings or settings.get('automation_status') != 'RUNNING':
                status = settings.get('automation_status', 'N/A') if settings else 'SEM CONFIG'
                logger.info(f"[REDIST] SKIP agencia {actual_agency_id}: Automacao nao esta RUNNING (status={status})")
                update_progress("stalled_clients_distribution", actual_agency_id, f"Automação pausada ({status})", 0)
                continue

            processed: int = processed + 1  # type: ignore[assignment]
            settings_id = settings.get('id')
            metadata = settings.get('metadata', {})

            pct = int((processed / total_agencies) * 20)
            update_progress("stalled_clients_distribution", actual_agency_id,
                          f"Processando agência {processed}/{total_agencies}...", pct)

            # --- CONTROLE DE INTERVALO ---
            interval_min = settings.get('interval_minutes', 1)
            last_run = last_runs.get(actual_agency_id)
            if last_run:
                diff = (now_br - last_run).total_seconds() / 60
                if diff < interval_min:
                    logger.info(f"[REDIST] SKIP agencia {actual_agency_id}: Intervalo nao atingido ({diff:.1f}/{interval_min} min)")
                    continue

            # --- HORÁRIO INDEPENDENTE (lê do próprio metadata) ---
            dispatch_start = metadata.get('start_time') or metadata.get('distribution_time', '08:00')
            dispatch_end = metadata.get('end_time', '18:00')

            # Padronizar HH:MM
            if dispatch_start and ":" in dispatch_start:
                parts = dispatch_start.split(":")
                dispatch_start = f"{parts[0].zfill(2)}:{parts[1].zfill(2)}"
            if dispatch_end and ":" in dispatch_end:
                parts = dispatch_end.split(":")
                dispatch_end = f"{parts[0].zfill(2)}:{parts[1].zfill(2)}"

            is_within = dispatch_start <= current_time_str <= dispatch_end
            if not is_within:
                logger.info(f"[REDIST] SKIP agencia {actual_agency_id}: Fora do expediente ({current_time_str}, janela {dispatch_start}-{dispatch_end})")
                update_progress("stalled_clients_distribution", actual_agency_id,
                              f"Fora do expediente ({dispatch_start}-{dispatch_end})", 0)
                continue

            logger.info(f"[REDIST] Dentro do expediente ({current_time_str}, janela {dispatch_start}-{dispatch_end})")

            # Marcar execução
            last_runs[actual_agency_id] = now_br

            # --- BUSCAR NOME DA AGÊNCIA ---
            unit_name = settings.get('agency_name')
            if not unit_name or unit_name == actual_agency_id or "-" in str(unit_name):
                name_resp = supabase.table("profiles").select("name").eq("id", actual_agency_id).limit(1).execute()
                unit_name = name_resp.data[0]['name'] if name_resp.data else actual_agency_id

            # --- BUSCAR CORRETORES ONLINE (Round-Robin por last_lead_received) ---
            all_b = supabase.table("profiles") \
                .select("id, name, active, role, checkin, phone, last_lead_received") \
                .eq("agency_id", actual_agency_id) \
                .eq("role", "broker") \
                .eq("active", "ativado") \
                .order("last_lead_received", desc=False, nullsfirst=True) \
                .execute()

            online_brokers = all_b.data or []

            # ===================================================
            # GRACE PERIOD LOGIC
            # ===================================================
            grace_min = metadata.get('grace_period_min', 0)
            grace_start_str = metadata.get('grace_period_start')

            if not online_brokers:
                # ZERO corretores -> resetar timer e avisar
                logger.info(f"[REDIST] SKIP agencia {unit_name}: 0 corretores online. {len(leads)} leads aguardando. Resetando timer.")
                if grace_start_str:
                    _clear_grace_period_start(settings_id, metadata)
                log_to_db("WARNING",
                         f"DISTRIBUIÇÃO AGUARDANDO: {len(leads)} leads represados na unidade {unit_name}, mas nenhum corretor ONLINE.",
                         actual_agency_id)
                update_progress("stalled_clients_distribution", actual_agency_id,
                              f"0 corretores online — {len(leads)} leads aguardando", 0)
                continue

            # Corretores online existem -> verificar Grace Period
            if grace_min and grace_min > 0:
                if not grace_start_str:
                    # Iniciar timer pela primeira vez
                    _save_grace_period_start(settings_id, metadata)
                    update_progress("stalled_clients_distribution", actual_agency_id,
                                  f"Aguardando corretores ({grace_min} min configurados)...", 10)
                    logger.info(f"[GRACE] Timer iniciado. Aguardando {grace_min} min antes de distribuir.")
                    continue
                else:
                    # Timer existe -> verificar se deu o tempo (com tolerancia de 5s)
                    try:
                        grace_start_dt = datetime.fromisoformat(grace_start_str)
                        elapsed_seconds = (now_br - grace_start_dt).total_seconds()
                    except (ValueError, TypeError):
                        elapsed_seconds = 0
                        logger.warning(f"[GRACE] grace_period_start invalido: '{grace_start_str}'. Resetando.")
                        _clear_grace_period_start(settings_id, metadata)

                    grace_seconds = grace_min * 60
                    elapsed_min = elapsed_seconds / 60

                    if elapsed_seconds < (grace_seconds - 5):  # tolerância de 5s
                        remaining = round(grace_min - elapsed_min, 1)
                        update_progress("stalled_clients_distribution", actual_agency_id,
                                      f"Grace period: {remaining} min restantes...", 15)
                        logger.info(f"[GRACE] AGUARDANDO: {elapsed_min:.1f}/{grace_min} min ({elapsed_seconds:.0f}/{grace_seconds}s). Faltam {remaining} min.")
                        continue
                    else:
                        # Grace period concluído! Limpar e prosseguir
                        logger.info(f"[GRACE] Grace period CONCLUIDO ({elapsed_seconds:.0f}s >= {grace_seconds - 5}s). Distribuindo!")
                        _clear_grace_period_start(settings_id, metadata)

            # ===================================================
            # DISTRIBUIÇÃO ROUND-ROBIN JUSTA
            # ===================================================
            logger.info(f"[REDIST] Distribuindo {len(leads)} leads para {len(online_brokers)} corretores na agencia {unit_name}")
            update_progress("stalled_clients_distribution", actual_agency_id,
                          f"Distribuindo {len(leads)} leads...", 30)

            delivered_names: List[str] = []
            broker_idx: int = 0

            for lead_i, lead in enumerate(leads):
                if not online_brokers:
                    break

                broker = online_brokers[broker_idx % len(online_brokers)]
                broker_id = broker['id']
                first_name = broker['name'].split(' ')[0] if broker.get('name') else 'Corretor'

                try:
                    client_phone = lead.get('phone')

                    # Verificar se cliente já existe
                    existing_client = supabase.table("clients").select("id").eq("phone", client_phone).execute()

                    if existing_client.data:
                        client_id_real = existing_client.data[0]['id']
                        supabase.table("clients").update({
                            "owner_id": broker_id,
                            "agency_id": actual_agency_id,
                            "status": "Qualificado",
                            "origin": "Represado"
                        }).eq("id", client_id_real).execute()

                        log_to_db("SUCCESS",
                                 f"DISTRIBUIÇÃO: Lead {client_phone} atribuído ao corretor {broker.get('name')}.",
                                 actual_agency_id, category="REDIST")
                    else:
                        client_data = {
                            "name": lead.get('name'),
                            "phone": client_phone,
                            "prefix": lead.get('prefix'),
                            "agency_id": actual_agency_id,
                            "owner_id": broker_id,
                            "status": "Qualificado",
                            "origin": "Represado"
                        }
                        supabase.table("clients").insert(client_data).execute()

                    # Deletar do represados
                    supabase.table("clientes_represados").delete().eq("id", lead['id']).execute()

                    # Round-Robin justo: atualizar last_lead_received do corretor
                    new_timestamp = get_now_br().isoformat()
                    supabase.table("profiles").update({
                        "last_lead_received": new_timestamp,
                        "checkin": get_now_br().strftime("%H:%M:%S")
                    }).eq("id", broker_id).execute()

                    delivered_names.append(f"{lead.get('name')} -> {first_name}")

                    # Notificação WhatsApp (fire-and-forget)
                    send_whatsapp_notification(
                        metadata=metadata,
                        broker_name=broker.get('name', ''),
                        broker_phone=broker.get('phone', ''),
                        lead_name=lead.get('name', ''),
                        lead_phone=client_phone or '',
                        agency_id=actual_agency_id
                    )

                    # Avançar Round-Robin
                    broker_idx += 1

                    # Atualizar progresso
                    lead_pct = 30 + int(((lead_i + 1) / len(leads)) * 50)
                    update_progress("stalled_clients_distribution", actual_agency_id,
                                  f"Entregue: {lead.get('name')} -> {first_name}", min(lead_pct, 90))

                except Exception as e:
                    err_msg = f"ERRO DISTRIBUIÇÃO [Lead: {lead.get('name')}]: {str(e)}"
                    logger.error(err_msg)
                    log_to_db("ERROR", err_msg, actual_agency_id)
                    broker_idx += 1  # Avançar mesmo com erro para não travar

            if delivered_names:
                count = len(delivered_names)
                msg = (
                    f"REDISTRIBUIÇÃO [Unidade: {unit_name}]: {count} clientes distribuídos.\n"
                    f"Entregas: {'; '.join(delivered_names)}"
                )
                logger.info(msg)
                log_to_db("INFO", msg, actual_agency_id)
                update_progress("stalled_clients_distribution", actual_agency_id,
                              f"[OK] {count} leads distribuidos", 100)

        update_progress("stalled_clients_distribution", None,
                       f"Concluído: {total_agencies} agências verificadas", 100)

    except Exception as e:
        logger.error(f"Erro no manage_stalled_clients_job: {str(e)}", exc_info=True)
        update_progress("stalled_clients_distribution", None, f"Erro: {str(e)[:100]}", 0)
