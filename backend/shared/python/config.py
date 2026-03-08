from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

# Procura .env no diretório atual, senão na raiz do projeto (../)
_env_file = Path(".env")
if not _env_file.exists():
    _env_file = Path(__file__).resolve().parent.parent / ".env"

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SECRET_KEY: str
    ENVIRONMENT: str = "development"

    class Config:
        env_file = str(_env_file)

@lru_cache()
def get_settings() -> Settings:
    return Settings()
