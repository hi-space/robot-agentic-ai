import os
import asyncio
import requests
import logging
import access_token
from tools import get_time
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent, tool
from strands.models import BedrockModel
from mcp.client.streamable_http import streamablehttp_client


app = BedrockAgentCoreApp()
agent = None
mcp_client = None


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Set logging level for specific libraries
logging.getLogger('requests').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('mcp').setLevel(logging.INFO)
logging.getLogger('strands').setLevel(logging.INFO)

# MCP Server configuration
MCP_SERVER_URL = os.getenv("GATEWAY_URL")
logger.info(f"MCP_SERVER_URL set to: {MCP_SERVER_URL}")

# Set GATEWAY_URL environment variable for access_token module
if MCP_SERVER_URL and not os.getenv("GATEWAY_URL"):
    os.environ["GATEWAY_URL"] = MCP_SERVER_URL



# Function to check if MCP server is running
def check_mcp_server():
    try:
        # Get the bearer token
        jwt_token = os.getenv("BEARER_TOKEN")
        
        logger.info(f"Checking MCP server at URL: {MCP_SERVER_URL}")
        
        # If no bearer token, try to get one (this will automatically refresh if needed)
        if not jwt_token:
            logger.info("No bearer token available, trying to get one...")
            try:
                jwt_token = access_token.get_gateway_access_token_with_retry(max_retries=2)
                logger.info("Token obtained successfully")
                # Update environment variable with the new token
                os.environ["BEARER_TOKEN"] = jwt_token
            except Exception as e:
                logger.error(f"Error getting token: {str(e)}", exc_info=True)
        
        if jwt_token:
            headers = {"Authorization": f"Bearer {jwt_token}", "Content-Type": "application/json"}
            payload = {
                "jsonrpc": "2.0",
                "id": "test",
                "method": "tools/list",
                "params": {}
            }
            
            try:
                response = requests.post(f"{MCP_SERVER_URL}/mcp", headers=headers, json=payload, timeout=10)
                logger.info(f"MCP server response status: {response.status_code}")
                
                if response.status_code == 200:
                    has_tools = "tools" in response.text
                    return has_tools
                else:
                    logger.error(f"MCP server response error: {response.status_code} - {response.text}")
                    return False
            except requests.exceptions.RequestException as e:
                logger.error(f"Request exception when checking MCP server: {str(e)}")
                return False
        else:
            # Try without token for local testing
            logger.info("No bearer token available, trying health endpoint")
            try:
                response = requests.get(f"{MCP_SERVER_URL}/health", timeout=5)
                logger.info(f"Health endpoint response status: {response.status_code}")
                
                return response.status_code == 200
            except requests.exceptions.RequestException as e:
                logger.error(f"Health endpoint request exception: {str(e)}")
                return False
    except Exception as e:
        logger.error(f"Error checking MCP server: {str(e)}", exc_info=True)
        return False




# Initialize Strands Agent with MCP tools
def initialize_agent():
    try:
        # Get OAuth token for authentication
        logger.info("Starting agent initialization...")
        
        # Create MCP client with authentication headers
        gateway_endpoint = os.getenv("GATEWAY_URL", MCP_SERVER_URL)
        logger.info(f"Using gateway endpoint: {gateway_endpoint}")
        
        try:
            logger.info("Loading tools from MCP server with retry logic...")
            
            # Use the retry logic from access_token module
            tools, mcp_client = access_token.load_tools_from_mcp_with_retry(
                gateway_endpoint, max_retries=2
            )
            
            if not tools or not mcp_client:
                logger.error("Failed to load tools from MCP server")
                return None, None
                
            logger.info(f"Loaded {len(tools)} tools from MCP server")
            
            # Log available tools
            if tools and len(tools) > 0:
                # Try to access the tool name using the correct attribute
                tool_names = []
                for tool in tools:
                    # Check if the tool has a 'schema' attribute that might contain the name
                    if hasattr(tool, 'schema') and hasattr(tool.schema, 'name'):
                        tool_names.append(tool.schema.name)
                    # Or if it has a direct attribute that contains the name
                    elif hasattr(tool, 'tool_name'):
                        tool_names.append(tool.tool_name)
                    # Or if it's in the __dict__
                    elif '_name' in vars(tool):
                        tool_names.append(vars(tool)['_name'])
                    else:
                        # If we can't find the name, use a placeholder
                        tool_names.append(f"Tool-{id(tool)}")
                
                logger.info(f"Available tools: {', '.join(tool_names)}")
            
        except Exception as e:
            logger.error(f"Error setting up MCP client: {str(e)}", exc_info=True)
            return None, None
        
        # Create an agent with these tools
        try:
            logger.info("Creating Strands Agent with tools...")
            model_id = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
            model = BedrockModel(model_id=model_id)
            
            agent = Agent(
                model=model,
                tools=tools,
                system_prompt="""당신은 사용자 요청에 따라 로봇에게 행동을 지시합니다.
                항상 적절한 도구를 선택해 사용하고, 최종적으로는 사용자가 이해하기 쉽게 현재 상황을 설명해줘.
                """
            )
            logger.info("Agent created successfully")
            
            return agent, mcp_client
        except Exception as e:
            logger.error(f"Error creating agent: {str(e)}", exc_info=True)
            return None, None
    except Exception as e:
        logger.error(f"Error initializing agent: {str(e)}", exc_info=True)
        return None, None


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

    global agent, mcp_client
    
    # Check if agent is initialized
    if not agent:
        logger.info("Agent not initialized, checking MCP server status...")
        # Try to initialize the agent if MCP server is running
        if check_mcp_server():
            logger.info("MCP server is running, attempting to initialize agent...")
            agent, mcp_client = initialize_agent()
            if not agent:
                error_msg = "Failed to initialize agent. Please ensure MCP server is running correctly."
                logger.error(error_msg)
                yield {"error": error_msg}
                return
            logger.info("Agent initialized successfully")
        else:
            error_msg = "Agent is not initialized. Please ensure MCP server is running."
            logger.error(error_msg)
            yield {"error": error_msg}
            return


    logger.info("Processing message with Strands Agent (streaming)...")
    try:
        # Stream response using agent.stream_async
        stream = agent.stream_async(user_message)
        async for event in stream:
            logger.debug(f"Streaming event: {event}")
            
            # Process different event types
            if "data" in event:
                # Text chunk from the model
                chunk = event["data"]
                yield {
                    "type": "chunk",
                    "data": chunk,
                }
            elif "current_tool_use" in event:
                # Tool use information
                tool_info = event["current_tool_use"]
                yield {
                    "type": "tool_use",
                    "tool_name": tool_info.get("name", "Unknown tool"),
                    "tool_input": tool_info.get("input", {}),
                    "tool_id": tool_info.get("toolUseId", "")
                }
            elif "reasoning" in event and event["reasoning"]:
                # Reasoning information
                yield {
                    "type": "reasoning",
                    "reasoning_text": event.get("reasoningText", "")
                }
            elif "result" in event:
                # Final result
                result = event["result"]
                if hasattr(result, 'message') and hasattr(result.message, 'content'):
                    if isinstance(result.message.content, list) and len(result.message.content) > 0:
                        final_response = result.message.content[0].get('text', '')
                    else:
                        final_response = str(result.message.content)
                else:
                    final_response = str(result)
                
                yield {
                    "type": "complete",
                    "final_response": final_response
                }
            elif "event" in event and "metadata" in event["event"]:
                metadata = event["event"]["metadata"]
                yield {
                    "type": "metadata",
                    "metadata": metadata
                }
            
            
    except Exception as e:
        logger.error(f"Error in streaming mode: {str(e)}", exc_info=True)
        yield {"error": f"Error processing request with agent: {str(e)}"}
    

if __name__ == "__main__":
    # Run the AgentCore Runtime App
    app.run()