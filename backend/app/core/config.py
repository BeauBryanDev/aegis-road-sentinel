
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Ignore unrelated keys already present in backend/.env (POSTGRES_*, etc.)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Auth ---
    secret_key: str = "change-me-in-production"  # overridden by SECRET_KEY in .env
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    # --- ML inference ---
    # CPU is the reliable default in the slim Docker image; flip to True only on a
    # CUDA-enabled host with onnxruntime-gpu installed.
    use_gpu: bool = False
    vehicle_conf_threshold: float = 0.5
    plate_conf_threshold: float = 0.45

    # --- Upload guardrails ---
    max_upload_size_mb: int = 10
    allowed_image_types: set[str] = {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/bmp",
    }


settings = Settings()
