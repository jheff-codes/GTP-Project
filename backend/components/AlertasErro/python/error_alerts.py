"""
Watchdog de Alertas de Erro — error_alerts.py
Monitora a tabela 'logs' buscando novos erros (level='ERROR')
e envia alertas via WhatsApp usando UAZAPI.

Deduplicação via checkpoint 'last_processed_timestamp' persistido
no metadata da automation_settings (name='error_alerts').
"""
import sys
import os
import logging
import time

print("INICIOU")

# Injeção dinâmica do caminho para shared/python (independente do CWD)
current_dir = os.path.dirname(os.path.abspath(__file__))
shared_path = os.path.abspath(os.path.join(current_dir, "../../../shared/python"))
if shared_path not in sys.path:
    sys.path.append(shared_path)

from database import supabase, send_error_alert, get_now_br, log_to_db  # type: ignore[import-not-found]

logger = logging.getLogger(__name__)


# ===============================================================
# FUNÇÕES AUXILIARES
# ===============================================================

def _get_alert_config() -> dict | None:
    """Busca a config de error_alerts na automation_settings."""
    try:
        response = supabase.table("automation_settings") \
            .select("*") \
            .eq("name", "error_alerts") \
            .eq("automation_status", "RUNNING") \
            .limit(1) \
            .execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        logger.error(f"[WATCHDOG] Erro ao buscar config error_alerts: {e}")
        return None


def _get_checkpoint(metadata: dict) -> str:
    """Extrai a data do último erro processado. Retorna string vazia se não existir."""
    return str(metadata.get("last_processed_timestamp", ""))


def _update_checkpoint(settings_id: str, metadata: dict, last_created_at: str) -> None:
    """Atualiza o checkpoint usando a data (timestamp) do último erro processado."""
    try:
        updated_meta = {**metadata, "last_processed_timestamp": last_created_at}
        supabase.table("automation_settings") \
            .update({"metadata": updated_meta}) \
            .eq("id", settings_id) \
            .execute()
        logger.info(f"[WATCHDOG] Memória atualizada para a data: {last_created_at}")
    except Exception as e:
        logger.error(f"[WATCHDOG] Falha ao atualizar checkpoint: {e}")


def _fetch_new_errors(last_checkpoint_date: str) -> list[dict]:
    """Busca logs de erro que aconteceram DEPOIS da data do checkpoint."""
    try:
        query = supabase.table("logs") \
            .select("*") \
            .eq("level", "ERROR")
        
        if last_checkpoint_date:
            query = query.gt("created_at", last_checkpoint_date)
            
        response = query.order("created_at", desc=False).limit(50).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"[WATCHDOG] Erro ao buscar logs: {e}")
        return []


# ===============================================================
# JOB PRINCIPAL
# ===============================================================

def error_alerts_job() -> None:
    """Fluxo principal do Watchdog."""
    now_str = get_now_br().strftime("%H:%M:%S")
    logger.info(f"[WATCHDOG] [{now_str}] Iniciando ciclo de verificação...")

    # 1. Buscar config
    config = _get_alert_config()
    if not config:
        logger.info("[WATCHDOG] ABORT: Nenhuma config 'error_alerts' com status RUNNING")
        return

    settings_id = config.get("id")
    metadata = config.get("metadata", {}) or {}

    if not settings_id:
        logger.error("[WATCHDOG] ABORT: Config sem ID — impossível atualizar checkpoint")
        return

    uazapi_url = metadata.get("uazapi_url", "")
    uazapi_token = metadata.get("uazapi_token", "")
    target_phone = metadata.get("target_phone", "")

    if not uazapi_url or not uazapi_token or not target_phone:
        logger.warning("[WATCHDOG] ABORT: Config incompleta (falta url/token/phone)")
        return

    # 2. Ler checkpoint (Agora busca por Data, não por ID)
    last_date = _get_checkpoint(metadata)
    logger.info(f"[WATCHDOG] Checkpoint atual: {last_date if last_date else 'Início dos tempos'}")

    # 3. Buscar novos erros
    new_errors = _fetch_new_errors(last_date)

    if not new_errors:
        logger.info(f"[WATCHDOG] ABORT: 0 novos erros encontrados.")
        return

    logger.info(f"[WATCHDOG] {len(new_errors)} novo(s) erro(s) encontrado(s)!")

    # 4. Enviar alertas
    max_date = last_date
    sent_count = 0

    for error_log in new_errors:
        log_id = error_log.get("id", "ID_DESCONHECIDO")
        log_msg = error_log.get("message", "Erro desconhecido")
        log_category = error_log.get("category", "SISTEMA")
        log_time = str(error_log.get("created_at", ""))

        local = log_category
        erro = log_msg[:500]

        try:
            send_error_alert(local=local, erro=erro)
            sent_count += 1
            logger.info(f"[WATCHDOG] [OK] Alerta enviado para erro [{log_id}]: {erro[:80]}...")
        except Exception as e:
            logger.error(f"[WATCHDOG] [FAIL] Falha ao enviar alerta para erro [{log_id}]: {e}")

        # Atualiza a data máxima independentemente do sucesso do envio (para não travar o loop)
        if log_time > max_date:
            max_date = log_time

        if len(new_errors) > 1:
            time.sleep(2)

    # 5. Atualizar checkpoint com a data do erro mais recente
    if max_date > last_date:
        _update_checkpoint(settings_id, metadata, max_date)

    logger.info(f"[WATCHDOG] Ciclo finalizado: {sent_count}/{len(new_errors)} alertas enviados")


# ===============================================================
# LOOP PM2 — Execução Contínua como Serviço
# ===============================================================

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    POLL_INTERVAL = 60  # segundos entre cada ciclo

    logger.info("[WATCHDOG] Iniciando serviço contínuo (PM2 mode)...")
    logger.info(f"[WATCHDOG] Intervalo de polling: {POLL_INTERVAL}s")

    while True:
        try:
            error_alerts_job()
        except Exception as exc:
            logger.error(
                f"[WATCHDOG] Erro não-tratado no ciclo: {type(exc).__name__}: {exc}",
                exc_info=True,
            )
        time.sleep(POLL_INTERVAL)