import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from google.adk.cli.fast_api import get_fast_api_app
from google.adk.cli.utils import logs
from loguru import logger

from app.config import get_settings

settings = get_settings()


def main(
    host: str = settings.HOST,
    port: int = settings.PORT,
    web: bool = True,
    reload: bool = True,
    reload_agents: bool = False,
    a2a: bool = False,
    trace_to_cloud: bool = False,
    eval_storage_uri: str | None = None,
    session_service_uri: str | None = None,
    artifact_service_uri: str | None = None,
    memory_service_uri: str | None = None,
):
    logs.setup_adk_logger(getattr(logging, settings.LOG_LEVEL.upper()))

    @asynccontextmanager
    async def _lifespan(app: FastAPI):
        if web:
            start_banner = f"""
            ADK Web Server Starting...
            ADK Testing Web URL: http://{host}:{port}
            """
        else:
            start_banner = f"""
            ADK API Server Starting...
            FastAPI Swagger UI at: http://{host}:{port}/docs
            """
        logger.info(start_banner)
        if web:
            logger.info(f"URL: http://{host}:{port}")
        yield
        shutdown_banner = f"ADK {'Web' if web else 'API'} Server Shutdown."
        logger.info(shutdown_banner)

    app = get_fast_api_app(
        host=host,
        port=port,
        web=web,
        agents_dir=str(settings.AGENTS_DIR),
        reload_agents=reload_agents,
        allow_origins=settings.ALLOW_ORIGINS,
        lifespan=_lifespan,
        a2a=a2a,
        session_service_uri=session_service_uri,
        artifact_service_uri=artifact_service_uri,
        memory_service_uri=memory_service_uri,
        eval_storage_uri=eval_storage_uri,
        trace_to_cloud=trace_to_cloud,
    )
    config = uvicorn.Config(
        app,
        host=host,
        port=port,
        reload=reload,
    )
    server = uvicorn.Server(config)
    server.run()


if __name__ == "__main__":
    main()
