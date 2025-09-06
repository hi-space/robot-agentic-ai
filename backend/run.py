#!/usr/bin/env python3
"""
Robot Agentic AI Backend 실행 스크립트
"""

import os
import sys
import uvicorn
from pathlib import Path

# 프로젝트 루트 디렉토리를 Python 경로에 추가
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.config import settings


def main():
    """메인 실행 함수"""
    print("🤖 Robot Agentic AI Backend 시작 중...")
    print(f"📍 환경: {'개발' if settings.debug else '프로덕션'}")
    print(f"🌐 호스트: {settings.api_host}:{settings.api_port}")
    print(f"🔗 CORS Origins: {settings.cors_origins}")
    print(f"📚 API 문서: http://{settings.api_host}:{settings.api_port}/docs")
    print("-" * 50)
    
    # Uvicorn 서버 실행
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        access_log=True
    )


if __name__ == "__main__":
    main()
