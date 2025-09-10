from strands import Agent, tool
from utils.s3_util import download_image_from_s3


@tool
def observe_env(image_path: str, description: str) -> str:
    """현재 로봇이 바라보고 있는 영상과 인식 정보를 바탕으로 현장 환경을 관찰하고 분석합니다.
    
    Args:
        image_path: 분석할 이미지의 S3 경로
        description: 이미지에 대한 상황 설명

    Returns:
        환경 관찰 및 분석 결과
    """
    try:
        # S3에서 이미지 다운로드
        image_bytes = download_image_from_s3(image_path)
        
        agent = Agent(
            model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
            system_prompt="""당신은 환경 관찰 전문가입니다. 주어진 이미지와 설명을 바탕으로 현장 상황을 종합적으로 분석하고 보고하세요.
                    다음 사항들을 포함하여 관찰 결과를 제공하세요:
                    - 안전성 상태 및 잠재적 위험 요소
                    - 작업 환경의 전반적인 상태
                    - 장비나 시설의 상태
                    - 이상 징후나 특이사항
                    - 개선이 필요한 부분이나 권장사항"""
        )

        response = agent([
            {"text": description},
            {
                "image": {
                    "format": "png",
                    "source": {
                        "bytes": image_bytes,
                    },
                },
            },
        ])
        return response
    except Exception as e:
        return f"Error in observe_env: {str(e)}"
