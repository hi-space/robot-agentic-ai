import logging
import hashlib
import uuid
from datetime import datetime
from typing import Any, Dict, Optional
import json

logger = logging.getLogger(__name__)


def generate_session_id() -> str:
    """Generate a unique session ID"""
    return str(uuid.uuid4())


def generate_task_id() -> str:
    """Generate a unique task ID"""
    return f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"


def generate_command_id() -> str:
    """Generate a unique command ID"""
    return f"cmd_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"


def hash_string(text: str) -> str:
    """Generate hash for a string"""
    return hashlib.sha256(text.encode()).hexdigest()


def safe_json_loads(json_string: str, default: Any = None) -> Any:
    """Safely parse JSON string"""
    try:
        return json.loads(json_string)
    except (json.JSONDecodeError, TypeError) as e:
        logger.warning(f"Failed to parse JSON: {e}")
        return default


def safe_json_dumps(obj: Any, default: str = "{}") -> str:
    """Safely serialize object to JSON"""
    try:
        return json.dumps(obj, ensure_ascii=False, default=str)
    except (TypeError, ValueError) as e:
        logger.warning(f"Failed to serialize to JSON: {e}")
        return default


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """Format datetime to ISO string"""
    if dt is None:
        dt = datetime.now()
    return dt.isoformat()


def parse_timestamp(timestamp_str: str) -> Optional[datetime]:
    """Parse ISO timestamp string to datetime"""
    try:
        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    except (ValueError, TypeError) as e:
        logger.warning(f"Failed to parse timestamp: {e}")
        return None


def validate_audio_format(filename: str) -> bool:
    """Validate audio file format"""
    allowed_formats = {'.wav', '.mp3', '.m4a', '.ogg', '.flac'}
    file_ext = filename.lower().split('.')[-1] if '.' in filename else ''
    return f'.{file_ext}' in allowed_formats


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    import re
    # Remove or replace unsafe characters
    safe_filename = re.sub(r'[^\w\-_\.]', '_', filename)
    # Limit length
    if len(safe_filename) > 100:
        name, ext = safe_filename.rsplit('.', 1) if '.' in safe_filename else (safe_filename, '')
        safe_filename = name[:95] + ('.' + ext if ext else '')
    return safe_filename


def get_file_size_mb(file_path: str) -> float:
    """Get file size in MB"""
    try:
        import os
        size_bytes = os.path.getsize(file_path)
        return size_bytes / (1024 * 1024)
    except OSError:
        return 0.0


def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text to maximum length"""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + "..."


def extract_keywords(text: str, min_length: int = 3) -> list:
    """Extract keywords from text"""
    import re
    # Remove special characters and split into words
    words = re.findall(r'\b\w+\b', text.lower())
    # Filter by minimum length
    keywords = [word for word in words if len(word) >= min_length]
    # Remove duplicates and return
    return list(set(keywords))


def is_robot_command(text: str) -> bool:
    """Check if text contains robot command keywords"""
    robot_keywords = [
        "이동", "움직여", "가", "와", "돌아", "회전", "정지", "멈춰",
        "들어", "내려", "올려", "잡아", "놓아", "열어", "닫아",
        "로봇", "제어", "명령", "실행", "동작", "앞으로", "뒤로",
        "왼쪽", "오른쪽", "위", "아래", "좌", "우"
    ]
    
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in robot_keywords)


def format_priority(priority: int) -> str:
    """Format priority number to human-readable string"""
    priority_map = {
        1: "Emergency",
        2: "High", 
        3: "Normal",
        4: "Low"
    }
    return priority_map.get(priority, "Unknown")


def validate_priority(priority: int) -> bool:
    """Validate priority value"""
    return 1 <= priority <= 4


def create_error_response(message: str, error_code: str = None) -> Dict[str, Any]:
    """Create standardized error response"""
    return {
        "success": False,
        "message": message,
        "error_code": error_code,
        "timestamp": format_timestamp()
    }


def create_success_response(message: str, data: Any = None) -> Dict[str, Any]:
    """Create standardized success response"""
    response = {
        "success": True,
        "message": message,
        "timestamp": format_timestamp()
    }
    if data is not None:
        response["data"] = data
    return response
