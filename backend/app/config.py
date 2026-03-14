from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    mongodb_uri: str = "mongodb://localhost:27017/repoguardian"
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    github_webhook_secret: str = ""
    github_api_base_url: str = "https://api.github.com"
    github_app_id: str = ""
    github_private_key_path: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    github_token: str = "" # Fallback static token for testing 

    enable_auto_pr_comment: bool = True

    chatbot_enable_llm: bool = True
    grok_api_key: str = ""
    grok_base_url: str = "https://api.x.ai/v1"
    grok_model: str = "grok-2-latest"
    chatbot_temperature: float = 0.3
    chatbot_max_tokens: int = 800


settings = Settings()
