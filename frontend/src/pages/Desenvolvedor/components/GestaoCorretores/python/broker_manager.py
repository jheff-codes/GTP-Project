import logging
from datetime import datetime, timedelta, time as dt_time
from database import supabase, log_to_db, get_now_br, update_progress

logger = logging.getLogger("PythonEngine")


# ============================================================================
# HELPERS
# ============================================================================

def _parse_time(raw: str) -> dt_time:
    """Parse HH:MM or HH:MM:SS into a time object."""
    fmt = "%H:%M:%S" if raw.count(":") == 2 else "%H:%M"
    return datetime.strptime(raw.strip(), fmt).time()


def _resolve(agency_meta: dict, global_meta: dict, key: str, default=None):
    """Hierarquia de metadados: Agencia -> Global -> default."""
    val = agency_meta.get(key)
    if val is not None:
        return val
    val = global_meta.get(key)
    if val is not None:
        return val
    return default


# ============================================================================
# LOGOUT
# ============================================================================

def logout_brokers(broker_ids: list[str], agency_id: str, unit_name: str, reason: str) -> int:
    """
    Desloga brokers: active='desativado', checkin=None.
    Retorna quantidade de afetados.
    """
    if not broker_ids:
        return 0

    try:
        response = supabase.table("profiles").update({
            "checkin": None,
            "active": "desativado",
        }).in_("id", broker_ids).execute()

        data = response.data or []
        count = len(data)

        if count > 0:
            names = "; ".join(p.get("name", "?").split(" ")[0] for p in data)
            msg = f"[LOGOUT] [{unit_name}]: {count} brokers. Motivo: {reason}. Nomes: {names}"
            logger.info(msg)
            log_to_db("INFO", msg, agency_id, category="PONTO")

        return count
    except Exception as e:
        logger.error(f"[ERROR] Erro ao deslogar brokers: {e}")
        log_to_db("ERROR", f"Falha no logout automatico: {e}", agency_id)
        return 0


# ============================================================================
# JOB PRINCIPAL
# ============================================================================

def manage_brokers_job() -> None:
    """
    Gerenciamento periodico de sessoes de brokers.

    Hierarquia de metadados:  Agencia  ->  Global  (SEM defaults hardcoded)
    Regras (em ordem de prioridade):
      A. FORA DO EXPEDIENTE  -> logout total
      B. ANTECIPACAO         -> reset antes da Janela de Ouro (se configurado)
      Durante o expediente, nenhum broker com checkin valido e deslogado.
    """
    try:
        now_br = get_now_br()
        current_time = now_br.time()
        current_ts = now_br.strftime("%H:%M")

        # -- 1. Carregar TODAS as configs de broker_management ---------------
        raw = (
            supabase.table("automation_settings")
            .select("*")
            .eq("name", "broker_management")
            .execute()
        ).data or []

        # Separar Global (agency_id IS NULL) das configs por agencia
        global_config = None
        agency_configs = []

        for c in raw:
            if str(c.get("automation_status", "")).strip().upper() != "RUNNING":
                continue
            if c.get("agency_id") is None:
                global_config = c
            else:
                agency_configs.append(c)

        global_meta: dict = (global_config or {}).get("metadata", {}) or {}

        if not agency_configs and not global_config:
            logger.info("[BROKER] Nenhuma config RUNNING encontrada.")
            update_progress("broker_management", None, "Sem configs RUNNING", 0)
            return

        logger.info(
            f"[BROKER] {len(agency_configs)} agencias "
            f"+ {'1 Global' if global_config else '0 Global'} | {current_ts}"
        )

        total_logout = 0

        # -- 2. Loop por agencia ---------------------------------------------
        for idx, config in enumerate(agency_configs):
            config_id = config["id"]
            agency_id = config["agency_id"]
            agency_meta: dict = config.get("metadata", {}) or {}

            # -- Resolver horarios de expediente (SEM fallback hardcoded) ----
            work_start_str = (
                _resolve(agency_meta, global_meta, "checkin_start", None)
                or _resolve(agency_meta, global_meta, "horario_inicial", None)
            )
            work_end_str = (
                _resolve(agency_meta, global_meta, "checkin_end", None)
                or _resolve(agency_meta, global_meta, "horario_final", None)
            )

            if not work_start_str or not work_end_str:
                logger.warning(
                    f"[BROKER] Agencia {config_id[:8]} (agency_id={agency_id}) "
                    f"sem horario de expediente configurado no metadata "
                    f"(checkin_start/horario_inicial ou checkin_end/horario_final). Pulando."
                )
                continue

            # -- Resolver Janela de Ouro (SEM fallback hardcoded) -----------
            gw_start_str = None
            gw_end_str   = None
            gw_source    = None

            # 1. Tentar access_schedules da agencia
            agency_schedules = agency_meta.get("access_schedules")
            if isinstance(agency_schedules, list) and len(agency_schedules) > 0:
                gw_start_str = agency_schedules[0].get("start")
                gw_end_str   = agency_schedules[0].get("end")
                if gw_start_str and gw_end_str:
                    gw_source = "access_schedules(agencia)"

            # 2. Tentar access_schedules do global
            if not gw_start_str or not gw_end_str:
                global_schedules = global_meta.get("access_schedules")
                if isinstance(global_schedules, list) and len(global_schedules) > 0:
                    gw_start_str = gw_start_str or global_schedules[0].get("start")
                    gw_end_str   = gw_end_str or global_schedules[0].get("end")
                    if gw_start_str and gw_end_str:
                        gw_source = "access_schedules(global)"

            # 3. Fallback: golden_window_start/end do metadata
            if not gw_start_str:
                gw_start_str = _resolve(agency_meta, global_meta, "golden_window_start", None)
            if not gw_end_str:
                gw_end_str = _resolve(agency_meta, global_meta, "golden_window_end", None)
            if gw_start_str and gw_end_str and not gw_source:
                gw_source = "golden_window metadata"

            # Antecipacao so funciona se a janela de ouro estiver configurada
            anticipation_min = int(_resolve(agency_meta, global_meta, "logout_anticipation_minutes", 0))

            # -- Parse dos horarios -----------------------------------------
            try:
                work_start = _parse_time(work_start_str)
                work_end   = _parse_time(work_end_str)
            except ValueError as e:
                logger.error(f"[ERROR] Hora de expediente invalida config {config_id[:8]}: {e}")
                continue

            gw_start = None
            gw_end   = None
            if gw_start_str and gw_end_str:
                try:
                    gw_start = _parse_time(gw_start_str)
                    gw_end   = _parse_time(gw_end_str)
                except ValueError as e:
                    logger.warning(f"[BROKER] Janela de Ouro invalida config {config_id[:8]}: {e}. Janela ignorada.")

            # Horario de antecipacao (ex: 09:00 - 5min = 08:55)
            anticipation_time = None
            if gw_start and anticipation_min > 0:
                anticipation_time = (
                    datetime.combine(now_br.date(), gw_start) - timedelta(minutes=anticipation_min)
                ).time()

            # Nome da agencia (para logs)
            unit_name = f"Agencia {config_id[:8]}"
            if agency_id:
                try:
                    nr = supabase.table("profiles").select("name").eq("id", agency_id).limit(1).execute()
                    if nr.data:
                        unit_name = nr.data[0].get("name", unit_name)
                except Exception:
                    pass

            prefix = f"[{unit_name}]"
            gw_info = f"{gw_start_str}-{gw_end_str} (fonte={gw_source})" if gw_start else "NAO CONFIGURADA"
            logger.info(
                f"[DECISION] {prefix} Agora={current_ts}, "
                f"Expediente={work_start_str}-{work_end_str}, "
                f"Janela={gw_info}, "
                f"Antecipacao={anticipation_min}min"
            )

            pct = int(((idx + 1) / len(agency_configs)) * 90)
            update_progress("broker_management", agency_id, f"Verificando {unit_name}...", pct)

            # -- Buscar brokers (role='broker') da agencia -------------------
            brokers = (
                supabase.table("profiles")
                .select("id, name, active, checkin")
                .eq("role", "broker")
                .eq("agency_id", agency_id)
                .execute()
            ).data or []

            if not brokers:
                logger.info(f"[INFO] {prefix} 0 brokers. Pulando.")
                continue

            # IDs de quem tem sessao ativa (checkin != null OR active='ativado')
            def _active_ids():
                return [
                    b["id"] for b in brokers
                    if b.get("checkin") is not None
                    or b.get("active") == "ativado"
                ]

            # ================================================================
            # REGRA A -- FORA DO EXPEDIENTE -> logout total
            # ================================================================
            if current_time < work_start or current_time >= work_end:
                ids = _active_ids()
                if ids:
                    n = logout_brokers(ids, agency_id, unit_name,
                                       f"FORA DO EXPEDIENTE ({work_start_str}-{work_end_str})")
                    total_logout += n
                    logger.info(f"[HARD STOP] {prefix} {n} logouts ({current_ts}, exp {work_start_str}-{work_end_str})")
                else:
                    logger.info(f"[OK] {prefix} Fora do expediente, 0 ativos.")

            # ================================================================
            # REGRA B -- ANTECIPACAO (reset antes da Janela de Ouro)
            # So dispara se janela E antecipacao estiverem configuradas
            # ================================================================
            elif anticipation_time and gw_start and anticipation_time <= current_time < gw_start:
                logger.info(
                    f"[DEBUG-TIME] {prefix} Antecipacao: "
                    f"{anticipation_time.strftime('%H:%M:%S')} <= "
                    f"{current_time.strftime('%H:%M:%S')} < "
                    f"{gw_start.strftime('%H:%M:%S')}"
                )
                ids = _active_ids()
                if ids:
                    n = logout_brokers(ids, agency_id, unit_name,
                                       f"ANTECIPACAO -- Janela de Ouro em {gw_start_str} ({anticipation_min}min)")
                    total_logout += n
                    logger.info(f"[ANTECIPACAO] {prefix} {n} logouts antes da Janela de Ouro")
                else:
                    logger.info(f"[ANTECIPACAO] {prefix} 0 brokers ativos para resetar.")

            # ================================================================
            # EXPEDIENTE NORMAL -- nenhum logout; apenas monitoracao
            # ================================================================
            else:
                active_count = len([b for b in brokers if b.get("checkin") is not None])
                logger.info(
                    f"[OK] {prefix} Dentro do expediente ({current_ts}). "
                    f"{active_count}/{len(brokers)} brokers com checkin ativo."
                )

        # -- Resumo ----------------------------------------------------------
        summary = f"Ciclo OK: {len(agency_configs)} agencias, {total_logout} logouts"
        logger.info(f"[BROKER] {summary}")
        update_progress("broker_management", None, summary, 100)

    except Exception as e:
        logger.error(f"[ERROR] Erro no manage_brokers_job: {e}", exc_info=True)
        update_progress("broker_management", None, f"Erro: {str(e)[:100]}", 0)
