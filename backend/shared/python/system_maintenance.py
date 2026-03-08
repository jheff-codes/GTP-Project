import os
import logging
from database import supabase, log_to_db

logger = logging.getLogger("PythonEngine")

def run_maintenance_job() -> None:
    """
    Executa a manutenção do sistema:
    1. Limpa a tabela logs no Supabase.
    2. Trunca o arquivo de log local automation.log.
    """
    logger.info("--- Iniciando Manutenção Semanal ---")
    
    # 1. Limpeza do Banco de Dados (Supabase)
    try:
        # Puxamos todos os IDs e deletamos (Supabase restringe delete sem filtro em algumas configs)
        # Como o objetivo é "limpar tudo", vamos usar um filtro que pegue todos (ex: level not null)
        response = supabase.table("logs").delete().neq("level", "CRITICAL_SYSTEM_RESERVED").execute()
        count = len(response.data) if response.data else 0
        logger.info(f"DB Maintenance: {count} registros de log removidos do Supabase.")
    except Exception as e:
        logger.error(f"Erro ao limpar logs no Supabase: {str(e)}")

    # 2. Limpeza do Log Local
    try:
        log_file = "automation.log"
        if os.path.exists(log_file):
            # Abrir em modo 'w' trunca o arquivo (esvazia)
            with open(log_file, 'w') as f:
                f.write(f"--- Log Reiniciado por Manutenção Automática ---\n")
            logger.info("Local Maintenance: Arquivo automation.log foi esvaziado.")
    except Exception as e:
        logger.error(f"Erro ao limpar log local: {str(e)}")

    logger.info("--- Manutenção Finalizada com Sucesso ---")
    log_to_db("INFO", "Manutenção semanal concluída: Logs limpos.")

if __name__ == "__main__":
    # Teste manual
    run_maintenance_job()
