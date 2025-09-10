import logging


class LoggerSetup:
    """Centralized logging configuration"""
    
    @staticmethod
    def setup_logging():
        """Configure logging for the application"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Set logging level for specific libraries
        logging.getLogger('requests').setLevel(logging.WARNING)
        logging.getLogger('urllib3').setLevel(logging.WARNING)
        logging.getLogger('mcp').setLevel(logging.INFO)
        logging.getLogger('strands').setLevel(logging.INFO)
        
        return logging.getLogger(__name__)
