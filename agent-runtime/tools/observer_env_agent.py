from strands import Agent, tool
from utils.s3_util import download_image_from_s3
from tools.robot_tools import get_robot_feedback, get_robot_detection, get_robot_gesture
from prompts.prompt import OBSERVER_ENV_AGENT_PROMPT


@tool
def observe_env_agent(image_path: str, description: str) -> str:
    """현재 로봇이 바라보고 있는 영상과 로봇의 상태 정보를 객관적으로 수집합니다.
    
    Args:
        image_path: 분석할 이미지의 S3 경로
        description: 이미지에 대한 상황 설명

    Returns:
        로봇 상태 정보와 환경 관찰 데이터 (객관적 정보만)
    """
    try:
        # S3에서 이미지 다운로드
        image_bytes = download_image_from_s3(image_path)
        
        agent = Agent(
            model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
            tools=[get_robot_feedback, get_robot_detection, get_robot_gesture],
            system_prompt=OBSERVER_ENV_AGENT_PROMPT
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
