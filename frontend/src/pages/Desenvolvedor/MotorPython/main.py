import sys
import os
import logging
import logging.handlers
import time
import threading

# ═══ Path Resolution ═══
# main.py está em src/pages/Desenvolvedor/MotorPython/
# Os módulos estão em pastas irmãs: shared/python e components/*/python
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))         # MotorPython/
_DEV_BASE = os.path.dirname(_CURRENT_DIR)                         # Desenvolvedor/

# Shared (config.py, database.py, system_maintenance.py)
sys.path.insert(0, os.path.join(_DEV_BASE, "shared", "python"))
# Componentes específicos
sys.path.insert(0, os.path.join(_DEV_BASE, "components", "GestaoCorretores", "python"))
sys.path.insert(0, os.path.join(_DEV_BASE, "components", "GestaoEstagnados", "python"))
sys.path.insert(0, os.path.join(_DEV_BASE, "components", "DisparadorMensagens", "python"))
sys.path.insert(0, os.path.join(_DEV_BASE, "components", "AlertasErro", "python"))

# ═══ Imports dos módulos (agora resolvidos via sys.path) ═══
from apscheduler.schedulers.background import BackgroundScheduler
from database import get_automation_settings, get_all_settings_for_name, log_to_db, send_error_alert, get_now_br, supabase
from broker_manager import manage_brokers_job
from system_maintenance import run_maintenance_job
from stalled_clients_manager import manage_stalled_clients_job
from message_dispatcher import message_dispatch_job
from error_alerts import error_alerts_job

# Setup logging com rotação para evitar logs infinitos
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.handlers.RotatingFileHandler(
            "automation.log", maxBytes=5*1024*1024, backupCount=2
        ),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("PythonEngine")

# Intervalos padrão (fallback caso não haja config no banco)
DEFAULT_INTERVALS = {
    "broker_management": 1,
    "stalled_clients_distribution": 1,
    "message_dispatch": 1,
}

# Cache de intervalos atuais para detectar mudanças
_current_intervals: dict[str, int] = {}

# Cache de status atuais para detectar STOPPED -> RUNNING
_last_known_status: dict[str, str] = {}

# Mapeamento de job functions para disparo imediato
JOB_FUNCTIONS = {
    "message_dispatch": message_dispatch_job,
    "broker_management": manage_brokers_job,
    "stalled_clients_distribution": manage_stalled_clients_job,
}


def get_interval_from_db(automation_name: str) -> int:
    """Lê o interval_minutes do banco (todas as configs: global + por agência).
    Retorna o MENOR intervalo entre as configs RUNNING para garantir que todas sejam atendidas.
    """
    try:
        all_settings = get_all_settings_for_name(automation_name)
        running = [s for s in all_settings if s.get("automation_status") == "RUNNING" and s.get("interval_minutes")]
        if running:
            return min(int(s["interval_minutes"]) for s in running)
    except Exception as e:
        logger.warning(f"Falha ao ler intervalo de {automation_name}: {e}")
    return DEFAULT_INTERVALS.get(automation_name, 1)


def safe_job_wrapper(job_fn, job_name: str):
    """Wrapper que captura exceções e envia alerta de erro e loga EXPLICITAMENTE."""
    def wrapped():
        now_str = get_now_br().strftime("%H:%M:%S")
        logger.info(f"[TRIGGER] [{now_str}] Job [{job_name}] DISPARADO pelo scheduler")
        try:
            job_fn()
            logger.info(f"[SUCCESS] [{now_str}] Job [{job_name}] FINALIZADO com sucesso")
        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            logger.error(f"[ERROR] ERRO CRITICO no job [{job_name}]: {error_msg}")
            log_to_db("ERROR", f"Erro crítico no job [{job_name}]: {error_msg}", category="ENGINE_AI")
            send_error_alert(local=job_name, erro=error_msg)
    wrapped.__name__ = f"safe_{job_fn.__name__}"
    return wrapped


def fire_job_immediately(automation_name: str):
    """Dispara um job imediatamente em thread separada (não bloqueia o sync loop)."""
    job_fn = JOB_FUNCTIONS.get(automation_name)
    if job_fn is None:
        return

    def _run():
        now_str = get_now_br().strftime("%H:%M:%S")
        logger.info(f"[IMMEDIATE] [{now_str}] IMMEDIATE TRIGGER: [{automation_name}] disparado por mudanca STOPPED -> RUNNING")
        try:
            job_fn()
            logger.info(f"[SUCCESS] [{now_str}] IMMEDIATE TRIGGER: [{automation_name}] FINALIZADO")
        except Exception as e:
            logger.error(f"[ERROR] IMMEDIATE TRIGGER [{automation_name}] falhou: {e}")

    thread = threading.Thread(target=_run, daemon=True, name=f"immediate-{automation_name}")
    thread.start()
    logger.info(f"[IMMEDIATE] Thread '{thread.name}' iniciada para execucao imediata.")


def check_status_changes():
    """
    Verifica se alguma automacao mudou de STOPPED -> RUNNING.
    Se sim, dispara o job imediatamente (sem esperar o scheduler).
    """
    global _last_known_status

    for name in JOB_FUNCTIONS.keys():
        try:
            # Buscar QUALQUER row RUNNING para este automation name
            response = supabase.table("automation_settings") \
                .select("automation_status, agency_id") \
                .eq("name", name) \
                .execute()

            rows = response.data or []

            # Status atual agregado: se QUALQUER row está RUNNING, consideramos RUNNING
            has_running = any(r.get("automation_status") == "RUNNING" for r in rows)
            current_status = "RUNNING" if has_running else "STOPPED"

            old_status = _last_known_status.get(name, "UNKNOWN")

            if old_status != "RUNNING" and current_status == "RUNNING":
                logger.info(f"[DETECT] [{name}] mudou de {old_status} -> RUNNING! Disparando IMEDIATAMENTE!")
                fire_job_immediately(name)

            _last_known_status[name] = current_status

        except Exception as e:
            logger.warning(f"Falha ao verificar status de {name}: {e}")


def sync_scheduler_intervals(scheduler: BackgroundScheduler):
    """Verifica se os intervalos mudaram no banco e reconfigura os jobs."""
    global _current_intervals

    jobs_config = {
        "message_dispatch": {
            "id": "message_dispatch_job",
            "fn": safe_job_wrapper(message_dispatch_job, "Disparos de Mensagem"),
        },
        "broker_management": {
            "id": "broker_mgmt_job",
            "fn": safe_job_wrapper(manage_brokers_job, "Gestão de Corretores"),
        },
        "stalled_clients_distribution": {
            "id": "stalled_clients_job",
            "fn": safe_job_wrapper(manage_stalled_clients_job, "Clientes Represados"),
        },
    }

    for name, cfg in jobs_config.items():
        new_interval = get_interval_from_db(name)
        old_interval = _current_intervals.get(name)

        if old_interval != new_interval:
            try:
                existing = scheduler.get_job(cfg["id"])
                if existing:
                    scheduler.remove_job(cfg["id"])

                scheduler.add_job(
                    cfg["fn"],
                    'cron',
                    minute=f'*/{new_interval}',
                    second='0',
                    id=cfg["id"],
                    replace_existing=True
                )
                _current_intervals[name] = new_interval
                logger.info(f"[SYNC] Job [{name}] reconfigurado: intervalo = {new_interval} min")
            except Exception as e:
                logger.error(f"Erro ao reconfigurar job [{name}]: {e}")


if __name__ == "__main__":
    scheduler = BackgroundScheduler()
    
    try:
        # Job de manutenção — fixo, semanal
        scheduler.add_job(
            safe_job_wrapper(run_maintenance_job, "Manutenção do Sistema"),
            'cron', day_of_week='mon', hour=12, minute=0,
            id='system_maintenance_job'
        )

        # Watchdog de Alertas de Erro — fixo, a cada 2 min
        scheduler.add_job(
            safe_job_wrapper(error_alerts_job, "Watchdog Alertas de Erro"),
            'cron', minute='*/2', second='30',
            id='error_alerts_watchdog_job'
        )

        # Configura os jobs dinâmicos pela primeira vez
        sync_scheduler_intervals(scheduler)

        # Inicializa cache de status (para não disparar ao boot)
        for name in JOB_FUNCTIONS.keys():
            try:
                resp = supabase.table("automation_settings") \
                    .select("automation_status") \
                    .eq("name", name) \
                    .execute()
                rows = resp.data or []
                has_running = any(r.get("automation_status") == "RUNNING" for r in rows)
                _last_known_status[name] = "RUNNING" if has_running else "STOPPED"
            except Exception:
                _last_known_status[name] = "UNKNOWN"

        scheduler.start()
        
        logger.info("=" * 60)
        logger.info("[START] Engine Python iniciado com SCHEDULER DINAMICO + IMMEDIATE TRIGGER")
        for name, interval in _current_intervals.items():
            status = _last_known_status.get(name, '?')
            logger.info(f"   --> {name}: {interval} min (status: {status})")
        logger.info("   --> Manutenção: seg 12:00")
        logger.info("   --> Watchdog Alertas: a cada 2 min")
        logger.info("   --> Sync a cada 60s (intervalo + detecção START)")
        logger.info("=" * 60)
        
        log_to_db("INFO", "Engine Python iniciado com scheduler dinamico + immediate trigger.", category="ENGINE_AI")

        # Executa broker job uma vez imediatamente
        manage_brokers_job()

        # Loop principal: verifica mudanças de intervalo + status a cada 60s
        sync_count = 0
        while True:
            time.sleep(60)
            sync_count += 1
            now_str = get_now_br().strftime("%H:%M")
            logger.info(f"[SYNC] #{sync_count} @ {now_str} -- Verificando intervalos e status...")
            sync_scheduler_intervals(scheduler)
            check_status_changes()

    except (KeyboardInterrupt, SystemExit):
        logger.info("Engine Python desligado.")
        scheduler.shutdown(wait=False)
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        logger.error(f"Falha ao iniciar o Engine: {error_msg}")
        send_error_alert(local="Engine Principal (main.py)", erro=error_msg)
