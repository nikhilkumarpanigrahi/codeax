from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    mongodb_uri: str = "mongodb://localhost:27017/codeax"
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    github_webhook_secret: str = ""
    github_api_base_url: str = "https://api.github.com"
    github_app_id: str = ""
    github_private_key_path: str = ""
    github_private_key: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    github_token: str = "" # Fallback static token for testing 
    github_installation_token_ttl_buffer_seconds: int = 60

    enable_auto_pr_comment: bool = True

    chatbot_enable_llm: bool = True
    llm_provider: str = "groq"
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "llama-3.3-70b-versatile"

    grok_api_key: str = ""
    grok_base_url: str = "https://api.x.ai/v1"
    grok_model: str = "grok-2-latest"
    grok_timeout_seconds: int = 40
    grok_retry_attempts: int = 2
    grok_retry_backoff_seconds: float = 0.8
    chatbot_temperature: float = 0.3
    chatbot_max_tokens: int = 800
    chatbot_max_history_messages: int = 12
    chatbot_system_prompt: str = ""


settings = Settings()
