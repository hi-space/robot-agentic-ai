import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings
from app.api import chat, voice, robot, health, commands, stream

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Robot Agentic AI Backend...")
    logger.info(f"Environment: {'Development' if settings.debug else 'Production'}")
    logger.info(f"API Host: {settings.api_host}:{settings.api_port}")
    logger.info(f"CORS Origins: {settings.cors_origins}")
    
    # Create necessary directories
    os.makedirs(settings.audio_temp_dir, exist_ok=True)
    os.makedirs(settings.audio_output_dir, exist_ok=True)
    
    yield
    
    # Shutdown
    logger.info("Shutting down Robot Agentic AI Backend...")


# Create FastAPI application
app = FastAPI(
    title="Robot Agentic AI Backend",
    description="FastAPI backend for robot control with Amazon Bedrock Strands Agent SDK",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.debug else ["localhost", "127.0.0.1"]
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "내부 서버 오류가 발생했습니다.",
            "error": str(exc) if settings.debug else "Internal server error"
        }
    )


# HTTP exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code
        }
    )


# Include routers
app.include_router(chat.router)
app.include_router(voice.router)
app.include_router(robot.router)
app.include_router(health.router)
app.include_router(commands.router)
app.include_router(stream.router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Robot Agentic AI Backend",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.debug else "disabled"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Simple health check"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
