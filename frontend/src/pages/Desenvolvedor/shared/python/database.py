import logging
import httpx  # type: ignore[import-not-found]
import pytz  # type: ignore[import-not-found]
from datetime import datetime
from supabase import create_client, Client  # type: ignore[import-not-found]
from config import get_settings  # type: ignore[import-not-found]
from typing import Optional, List

logger = logging.getLogger("PythonEngine")
settings = get_settings()

# === DIAGNOSTICO DE AMBIENTE ===
logger.info("[ENV] CHECK DE AMBIENTE:")
logger.info(f"   -> URL configurada: {settings.SUPABASE_URL}")
logger.info(f"   -> Chave encontrada? {'SIM' if settings.SUPABASE_KEY else 'NAO'}")
if settings.SUPABASE_KEY:
    logger.info(f"   -> Inicio da chave: {settings.SUPABASE_KEY[:20]}...")
    logger.info(f"   -> Tamanho da chave: {len(settings.SUPABASE_KEY)} caracteres")
    logger.info(f"   -> Tipo de chave: {'service_role' if 'service_role' in settings.SUPABASE_KEY else 'anon'}")
logger.info(f"   -> Ambiente: {settings.ENVIRONMENT}")

# Fuso horário de Brasília (single source of truth)
tz = pytz.timezone('America/Sao_Paulo')

def get_now_br() -> datetime:
    """Retorna o datetime atual no fuso horário de Brasília."""
    return datetime.now(tz)

# Initialize Supabase client
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)

def get_automation_settings(name: str, agency_id: Optional[str] = None) -> Optional[dict]:
    """Fetch settings from the database, prioritizing agency-specific over global."""
    try:
        if agency_id:
            response = supabase.table("automation_settings")\
                .select("*")\
                .eq("name", name)\
                .eq("agency_id", agency_id)\
                .execute()
            if response.data:
                return response.data[0]
                
        # Fallback to global
        response = supabase.table("automation_settings")\
            .select("*")\
            .eq("name", name)\
            .is_("agency_id", "null")\
            .execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error fetching automation settings: {e}")
        return None

def get_all_settings_for_name(name: str) -> List[dict]:
    """Fetch ALL rows for an automation name (global + per-agency). Used by scheduler."""
    try:
        response = supabase.table("automation_settings")\
            .select("*")\
            .eq("name", name)\
            .execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching all settings for {name}: {e}")
        return []

def get_error_alert_settings() -> Optional[dict]:
    """Fetch the error alert configuration from automation_settings (unified table).
    Returns the metadata dict with uazapi_url, uazapi_token, target_phone, message_template.
    """
    try:
        response = supabase.table("automation_settings")\
            .select("*")\
            .eq("name", "error_alerts")\
            .eq("is_active", True)\
            .limit(1)\
            .execute()
        if response.data:
            row = response.data[0]
            meta = row.get("metadata", {}) or {}
            if meta.get("uazapi_url") and meta.get("uazapi_token") and meta.get("target_phone"):
                return meta
        return None
    except Exception as e:
        logger.error(f"Error fetching error alert settings: {e}")
        return None

def send_error_alert(local: str, erro: str) -> None:
    """Send a critical error notification via WhatsApp using UAZAPI."""
    logger.info(f" send_error_alert chamado: local={local}, erro={erro[:100]}")  # type: ignore[index]
    try:
        alert_config = get_error_alert_settings()
        if not alert_config:
            logger.warning("[ALERT] Alerta de erro: config nao encontrada ou inativa no banco. Pulando notificacao WhatsApp.")
            return

        logger.info(f"[ALERT] Config de alerta encontrada: url={alert_config.get('uazapi_url')}, phone={alert_config.get('target_phone')}, is_active={alert_config.get('is_active')}")

        now = get_now_br()
        horario = now.strftime("%d/%m/%Y %H:%M:%S")

        template = alert_config.get("message_template") or "[ERRO] {local} - {erro} as {horario}"
        message = template.replace("{local}", local).replace("{erro}", str(erro)).replace("{horario}", horario)
        logger.info(f"[ALERT] Mensagem formatada ({len(message)} chars): {message[:150]}...")  # type: ignore[index]

        url = alert_config["uazapi_url"].rstrip("/")
        endpoint = f"{url}/send/text"
        payload = {
            "number": alert_config["target_phone"],
            "text": message
        }
        headers = {
            "Content-Type": "application/json",
            "token": alert_config["uazapi_token"]
        }

        logger.info(f"[ALERT] Enviando POST para {endpoint} | phone={payload['number']}")

        with httpx.Client(timeout=15) as client:
            resp = client.post(endpoint, json=payload, headers=headers)
            logger.info(f"[ALERT] Resposta HTTP: status={resp.status_code}, body={resp.text[:300]}")
            if resp.status_code == 200:
                logger.info(f"[SUCCESS] Alerta de erro enviado via WhatsApp para {alert_config['target_phone']}")
                log_to_db("WARNING", f"Alerta de erro enviado: {local} - {erro}", category="NOTIF")
            else:
                logger.error(f"[ERROR] Falha ao enviar alerta WhatsApp: HTTP {resp.status_code} - {resp.text}")
    except httpx.TimeoutException as e:
        logger.error(f"[ERROR] Timeout ao enviar alerta de erro: {e}")
    except httpx.ConnectError as e:
        logger.error(f"[ERROR] Erro de conexao ao enviar alerta: {e}")
    except Exception as e:
        logger.error(f"[ERROR] Falha critica ao enviar alerta de erro via WhatsApp: {type(e).__name__}: {e}", exc_info=True)

def update_progress(name: str, agency_id: Optional[str], action: str, percent: int) -> None:
    """Update real-time progress for an automation (Single Brain heartbeat).
    
    Args:
        name: Automation name (e.g. 'broker_management', 'message_dispatch')
        agency_id: Agency UUID or None for global
        action: Current action description (e.g. 'Enviando para 5511999...')
        percent: Progress percentage (0-100)
    """
    try:
        query = supabase.table("automation_settings") \
            .update({
                "current_action": action[:200],  # type: ignore[index]
                "progress_percent": max(0, min(100, percent))
            }) \
            .eq("name", name)
        
        if agency_id:
            query = query.eq("agency_id", agency_id)
        else:
            query = query.is_("agency_id", "null")
        
        query.execute()
    except Exception as e:
        # Non-critical: don't let progress updates break the job
        logger.debug(f"Falha ao atualizar progresso [{name}]: {e}")


def update_instance_progress(name: str, agency_id: Optional[str], instance_name: str, action: str, percent: int) -> None:
    """Update progress for a specific UAZAPI instance (thread-safe via JSONB merge).

    Uses a Postgres RPC function that atomically merges the instance's key
    into the instance_progress JSONB column, preventing concurrent threads
    from overwriting each other's data.
    """
    try:
        supabase.rpc("merge_instance_progress", {
            "p_name": name,
            "p_agency_id": agency_id,
            "p_instance_name": instance_name,
            "p_percent": max(0, min(100, percent)),
            "p_action": action[:100]  # type: ignore[index]
        }).execute()
    except Exception as e:
        logger.debug(f"Falha progress instance [{instance_name}]: {e}")


def reset_instance_progress(name: str, agency_id: Optional[str]) -> None:
    """Reset instance_progress to empty object after cycle completes."""
    try:
        query = supabase.table("automation_settings") \
            .update({"instance_progress": {}}) \
            .eq("name", name)

        if agency_id:
            query = query.eq("agency_id", agency_id)
        else:
            query = query.is_("agency_id", "null")

        query.execute()
    except Exception as e:
        logger.debug(f"Falha ao resetar instance_progress: {e}")


def get_work_hours(agency_id: Optional[str] = None) -> dict:
    """Single Brain: Get work hours from broker_management config (central source of truth).
    
    All automations MUST use this function to determine if they should run.
    The work hours are defined in broker_management metadata (checkin_start / checkin_end).
    
    Returns:
        dict with 'start' (str HH:MM), 'end' (str HH:MM), 'is_within' (bool)
    """
    try:
        settings = get_automation_settings("broker_management", agency_id)
        if not settings:
            # Fallback to global if agency-specific not found
            settings = get_automation_settings("broker_management")
        
        metadata = (settings or {}).get("metadata", {})
        start_str = metadata.get("checkin_start", "08:00")
        end_str = metadata.get("checkin_end", "18:00")
        
        now = get_now_br()
        current_time = now.strftime("%H:%M")
        
        is_within = start_str <= current_time <= end_str
        
        # VERBOSE DEBUG: mostrar EXATAMENTE o fuso sendo usado
        logger.info(f"[WORK_HOURS] agency_id={agency_id}")
        logger.info(f"[WORK_HOURS] get_now_br() = {now.isoformat()} (tz={now.tzinfo})")
        logger.info(f"[WORK_HOURS] current_time={current_time}, expediente={start_str}-{end_str}")
        logger.info(f"[WORK_HOURS] '{start_str}' <= '{current_time}' <= '{end_str}' -> is_within={is_within}")
        
        return {
            "start": start_str,
            "end": end_str,
            "is_within": is_within,
            "current_time": current_time
        }
    except Exception as e:
        logger.warning(f"Falha ao ler horário central: {e}. Usando default 08:00-18:00.")
        now = get_now_br()
        current_time = now.strftime("%H:%M")
        return {
            "start": "08:00",
            "end": "18:00",
            "is_within": "08:00" <= current_time <= "18:00",
            "current_time": current_time
        }


def log_to_db(level: str, message: str, agency_id: Optional[str] = None, category: str = "SISTEMA") -> None:
    """Log a message to the database for CRM visibility.
    
    Categorias válidas: ENGINE_AI, SISTEMA, ACESSO, PONTO, REDIST, DISPAROS, NOTIF
    """
    try:
        data = {
            "level": level,
            "message": message,
            "category": category
        }
        if agency_id:
            data["agency_id"] = agency_id
            
        supabase.table("logs").insert(data).execute()
    except Exception as e:
        logger.error(f"Failed to log to DB: {e}")
