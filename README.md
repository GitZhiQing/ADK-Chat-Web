# ADK Chat Web

Agent Chat Web with [Google ADK(Agent Development Kit)](https://google.github.io/adk-docs/) & [Ant Design](https://ant-design.antgroup.com/index-cn) & [Ant Design X](https://x.ant.design/index-cn).

## 运行

> [!WARNING]
> 本项目仅供学习、测试使用，请勿用于生产环境。

### ADK API Server

参考 `.env.example` 在项目根目录创建 `.env` 文件，大模型服务 API 相关环境变量被 [LiteLLM](app/models.py) 使用，你可以调整为自己的 API 服务。

和风天气 API 请通过 [和风天气开发服务](https://dev.qweather.com/) 获取。

```
# 大模型 API，本项目使用 VLLM API
HOSTED_VLLM_API_BASE=http://<API_HOST>:<API_PORT>/v1
HOSTED_VLLM_API_KEY=<API_KEY>
HOSTED_VLLM_MODEL_ID=hosted_vllm/<PROVIDER>/<MODEL_NAME>
# 和风天气 API
QWEATHER_API_BASE=https://<QWEATHER_API_HOST>/v7
QWEATHER_PROJECT_ID=<QWEATHER_PROJECT_ID>
QWEATHER_KEY_ID=<QWEATHER_KEY_ID>
```

项目根目录通过 uv 运行 `run.py` 启动 ADK API Server。

```
uv run run.py
```

### React Web Server

参考 `web/.env.example` 在项目 `web` 目录创建 `.env` 文件。

```
VITE_API_BASE_URL=<ADK_API_SERVER_BASE_URL>
```

项目 `web` 目录通过运行 `pnpm dev` 启动开发服务器。

```
pnpm i && pnpm dev
```

## 预览

![demon1](./images/demon1.png)

---

![demo2](./images/demo2.png)

---

![demo3](./images/demo3.png)
