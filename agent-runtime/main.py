import logging
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from config.config import Config
from core.mcp_manager import MCPServerManager
from core.agent_manager import AgentManager
from core.stream_processor import StreamProcessor
from utils.logger import LoggerSetup


# Initialize configuration and logging
config = Config.from_config_file()
logger = LoggerSetup.setup_logging()
app = BedrockAgentCoreApp()

# Initialize managers
mcp_manager = MCPServerManager(config)
agent_manager = AgentManager(config, mcp_manager)


@app.entrypoint
async def strands_agent_bedrock_streaming(payload, context):
    """
    Invoke the agent with streaming capabilities
    This function demonstrates how to implement streaming responses
    with AgentCore Runtime using async generators
    """
    user_message = payload.get("prompt")
    debug = payload.get("debug", False)  # Add debug parameter, default to False
    logger.info(f"Received user message: {user_message}, debug mode: {debug}")

    print("=== Runtime Context Information ===")
    print("Runtime Session ID:", context.session_id)
    print("Context Object Type:", type(context))
    print("User input:", user_message)
    print("Debug mode:", debug)
    print("=== End Context Information ===")

    # Ensure agent is initialized
    logger.info("Checking agent initialization...")
    if not agent_manager.ensure_initialized(debug=debug):
        if debug:
            error_msg = "Failed to initialize agent in debug mode. Please check local tools configuration."
            logger.error(error_msg)
        else:
            error_msg = "Failed to initialize agent. Please ensure MCP server is running correctly."
            logger.error(error_msg)
            logger.error(f"MCP server URL: {mcp_manager.config.mcp_server_url}")
            logger.error(f"Bearer token available: {bool(mcp_manager.config.bearer_token)}")
        yield {"error": error_msg}
        return

    # Get the initialized agent
    agent = agent_manager.get_agent()
    if not agent:
        error_msg = "Agent is not available"
        logger.error(error_msg)
        yield {"error": error_msg}
        return

    # Process the stream
    stream = agent.stream_async(user_message)
    stream_processor = StreamProcessor(logger)
    
    async for event in stream_processor.process_stream(stream, user_message):
        yield event
    

if __name__ == "__main__":
    # Run the AgentCore Runtime App
    app.run()