import logging
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from config import Config
from mcp_manager import MCPServerManager
from agent_manager import AgentManager
from stream_processor import StreamProcessor
from logger_setup import LoggerSetup


# Initialize configuration and logging
config = Config.from_env()
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
    logger.info(f"Received user message: {user_message}")

    print("=== Runtime Context Information ===")
    print("Runtime Session ID:", context.session_id)
    print("Context Object Type:", type(context))
    print("User input:", user_message)
    print("=== End Context Information ===")

    # Ensure agent is initialized
    if not agent_manager.ensure_initialized():
        error_msg = "Failed to initialize agent. Please ensure MCP server is running correctly."
        logger.error(error_msg)
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