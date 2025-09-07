import os
import time
import json
import boto3
from pathlib import Path
from dotenv import load_dotenv
from bedrock_agentcore_starter_toolkit import Runtime
from boto3.session import Session

# Load environment variables from .env file
load_dotenv()

# Initialize AWS session
boto_session = Session()
region = boto_session.region_name or os.getenv("AWS_REGION", "us-west-2")

print(f"Using AWS Region: {region}")

# Environment variables configuration
def get_env_vars():
    """Get environment variables with proper fallbacks"""
    env_vars = {
        "AWS_REGION": region,
        "AGENT_RUNTIME_ARN": os.getenv("AGENT_RUNTIME_ARN"),
        "GATEWAY_URL": os.getenv("GATEWAY_URL"),
        "COGNITO_DOMAIN": os.getenv("COGNITO_DOMAIN"),
        "COGNITO_CLIENT_ID": os.getenv("COGNITO_CLIENT_ID"),
        "COGNITO_USERNAME": os.getenv("COGNITO_USERNAME"),
        "COGNITO_PASSWORD": os.getenv("COGNITO_PASSWORD"),
        "SECRET_NAME": os.getenv("SECRET_NAME"),
        "BEARER_TOKEN": os.getenv("BEARER_TOKEN", ""),
    }
    
    # Filter out None values
    return {k: v for k, v in env_vars.items() if v is not None}



def main():
    """Main deployment function"""
    print("Starting Strands Agent Runtime Deployment...")
    
    # Get environment variables
    env_vars = get_env_vars()
    print(env_vars)
    
    # Initialize Bedrock AgentCore Runtime
    print("\n=== Initializing Bedrock AgentCore Runtime ===")
    agentcore_runtime = Runtime()
    
    # Configure the runtime with environment variables
    print("\n=== Configuring Runtime ===")
    try:
        response = agentcore_runtime.configure(
            entrypoint="strands_agent_runtime.py",
            auto_create_execution_role=True,
            auto_create_ecr=True,
            requirements_file="requirements.txt",
            region=region,
            agent_name="robot-strands-agent",
        )
        print("Runtime configuration successful:")
        print(json.dumps(response, indent=2, default=str))
    except Exception as e:
        print(f"Error configuring runtime: {e}")
        return False
    
    # Launch the runtime
    print("\n=== Launching Runtime ===")
    try:
        launch_result = agentcore_runtime.launch(env_vars=env_vars)
        print("Runtime launch successful:")
        print(json.dumps(launch_result, indent=2, default=str))
    except Exception as e:
        print(f"Error launching runtime: {e}")
        return False
    
    # Wait for deployment to complete
    print("\n=== Waiting for Deployment to Complete ===")
    try:
        status_response = agentcore_runtime.status()
        status = status_response.endpoint['status']
        end_status = ['READY', 'CREATE_FAILED', 'DELETE_FAILED', 'UPDATE_FAILED']
        
        print(f"Initial status: {status}")
        
        while status not in end_status:
            time.sleep(10)
            status_response = agentcore_runtime.status()
            status = status_response.endpoint['status']
            print(f"Current status: {status}")
        
        if status == 'READY':
            print("\n✅ Deployment completed successfully!")
            print(f"Runtime endpoint: {status_response.endpoint.get('endpoint_url', 'N/A')}")
        else:
            print(f"\n❌ Deployment failed with status: {status}")
            return False
            
    except Exception as e:
        print(f"Error checking deployment status: {e}")
        return False
    
    # Print summary
    print("\n=== Deployment Summary ===")
    print(f"Region: {region}")
    print(f"Agent Name: strands_claude_streaming")
    print(f"Entrypoint: strands_agent_runtime.py")
    print(f"Environment Variables: {len(env_vars)} configured")
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
