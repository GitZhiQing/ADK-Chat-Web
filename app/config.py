from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from loguru import logger
from pydantic import ValidationError
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    ALLOW_ORIGINS: list[str] = ["*"]
    # 数据目录
    APP_DIR: Path = Path(__file__).resolve().parent
    DATA_DIR: Path = APP_DIR.parent / "data"
    AGENTS_DIR: Path = APP_DIR / "agents"
    # 模型 API
    HOSTED_VLLM_MODEL_ID: str
    HOSTED_VLLM_API_KEY: str
    HOSTED_VLLM_API_BASE: str
    # 和风天气 API
    QWEATHER_API_BASE: str
    QWEATHER_KEY_ID: str
    QWEATHER_PROJECT_ID: str


@lru_cache
def get_settings() -> Settings:
    try:
        load_dotenv()
        return Settings()

    except ValidationError as e:
        logger.error(f"配置导入错误: {e}")
        # 分析具体的错误原因
        missing_vars = []  # 缺失变量
        invalid_vars = []  # 无效变量
        for error in e.errors():
            field_name = error.get("loc", [""])[0] if error.get("loc") else ""
            error_type = error.get("type", "")
            # 检查是否是缺失必需字段的错误
            if error_type == "missing":
                missing_vars.append(field_name)
            else:
                # 其他类型的验证错误（类型错误、值错误等）
                invalid_vars.append(f"{field_name}: {error.get('msg', '验证失败')}")
        # 根据错误类型打印更易读的错误信息
        if missing_vars:
            logger.error(f"[!] 缺少必需环境变量 [{', '.join(missing_vars)}]，请检查 .env 文件配置")
        if invalid_vars:
            logger.error(f"[!] 环境变量值错误: {', '.join(invalid_vars)}")
        exit(1)
