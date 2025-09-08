from datetime import UTC, datetime, timedelta

import jwt

from app.config import get_settings

settings = get_settings()


def create_qweather_jwt():
    """
    生成和风天气API所需的JWT Token

    Returns:
    str: 生成的JWT Token
    """
    # 获取当前UTC时间
    now_utc = datetime.now(UTC)
    # 设置Token过期时间（1小时后）
    expiration_time = now_utc + timedelta(hours=1)

    # Header
    headers = {
        "alg": "EdDSA",
        "kid": settings.QWEATHER_KEY_ID,
    }

    # Payload
    payload = {
        "sub": settings.QWEATHER_PROJECT_ID,
        "exp": expiration_time,
        "iat": now_utc,
    }

    # 读取私钥
    private_key_path = settings.DATA_DIR / "ed25519-private.pem"
    with open(private_key_path, "rb") as f:
        private_key = f.read()

    # 生成 Token
    token = jwt.encode(payload=payload, key=private_key, algorithm="EdDSA", headers=headers)

    return token


if __name__ == "__main__":
    token = create_qweather_jwt()
    print("Generated JWT Token:")
    print(token)
