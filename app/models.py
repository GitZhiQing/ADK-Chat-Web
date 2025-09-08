from google.adk.models.lite_llm import LiteLlm

from app.config import get_settings

settings = get_settings()

main_model = LiteLlm(
    model=settings.HOSTED_VLLM_MODEL_ID,
    api_base=settings.HOSTED_VLLM_API_BASE,
    api_key=settings.HOSTED_VLLM_API_KEY,
)
