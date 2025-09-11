#!/bin/bash

# Deploy script for Bedrock AgentCore Runtime using CLI commands
# This script replaces the Python deploy.py with shell commands

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to load configuration from config.json
load_config() {
    local config_file="$(dirname "$0")/../config/config.json"
    
    if [[ ! -f "$config_file" ]]; then
        print_error "config.json not found at $config_file"
        exit 1
    fi
    
    # Load configuration using jq (install if not available)
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed. Please install jq first."
        exit 1
    fi
    
    # Export configuration as environment variables
    export AWS_REGION=$(jq -r '.region // "us-west-2"' "$config_file")
    export GATEWAY_URL=$(jq -r '.gateway_url // ""' "$config_file")
    export COGNITO_CLIENT_ID=$(jq -r '.cognito.client_id // ""' "$config_file")
    export COGNITO_USERNAME=$(jq -r '.cognito.test_username // ""' "$config_file")
    export COGNITO_PASSWORD=$(jq -r '.cognito.test_password // ""' "$config_file")
    export SECRET_NAME=$(jq -r '.secret_name // ""' "$config_file")
    
    # Use environment variable if set, otherwise leave empty for auto-creation
    export EXECUTION_ROLE="${EXECUTION_ROLE:-}"
    export BEARER_TOKEN=""  # Set separately if needed
    
    print_status "Configuration loaded from $config_file"
    print_status "AWS Region: $AWS_REGION"
    print_status "Gateway URL: $GATEWAY_URL"
    
    # Validate required configuration
    if [[ -z "$GATEWAY_URL" ]]; then
        print_error "GATEWAY_URL is not configured in config.json"
        exit 1
    fi
    
    if [[ -z "$COGNITO_CLIENT_ID" ]]; then
        print_error "COGNITO_CLIENT_ID is not configured in config.json"
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if agentcore CLI is available
    if ! command -v agentcore &> /dev/null; then
        print_error "agentcore CLI not found. Please install bedrock-agentcore-starter-toolkit:"
        print_error "pip install bedrock-agentcore-starter-toolkit"
        exit 1
    fi
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI not configured or credentials not valid"
        exit 1
    fi
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed. Please install jq first."
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to configure the agent
configure_agent() {
    print_status "Configuring Bedrock AgentCore Runtime..."
    
    local entrypoint="main.py"
    local agent_name="robot_strands_agent"
    local requirements_file="requirements.txt"
    
    # Check if entrypoint exists
    if [[ ! -f "$entrypoint" ]]; then
        print_error "Entrypoint file $entrypoint not found"
        exit 1
    fi
    
    # Check if requirements.txt exists
    if [[ ! -f "$requirements_file" ]]; then
        print_error "Requirements file $requirements_file not found"
        exit 1
    fi
    
    # Configure the agent
    if [[ -n "$EXECUTION_ROLE" ]]; then
        print_status "Using execution role from config: $EXECUTION_ROLE"
        agentcore configure \
            --entrypoint "$entrypoint" \
            --name "$agent_name" \
            --requirements-file "$requirements_file" \
            --region "$AWS_REGION" \
            --execution-role "$EXECUTION_ROLE"
    else
        print_status "No execution role specified, letting agentcore auto-create"
        agentcore configure \
            --entrypoint "$entrypoint" \
            --name "$agent_name" \
            --requirements-file "$requirements_file" \
            --region "$AWS_REGION"
    fi
    
    print_success "Agent configuration completed"
}

# Function to launch the agent
launch_agent() {
    print_status "Launching Bedrock AgentCore Runtime..."
    
    # Export environment variables for the runtime
    # Note: GATEWAY_URL and BEARER_TOKEN are now loaded from config.json
    export COGNITO_CLIENT_ID
    export COGNITO_USERNAME
    export COGNITO_PASSWORD
    export SECRET_NAME
    
    # Launch the agent with environment variables
    print_status "Launching with environment variables:"
    print_status "  COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID"
    print_status "  COGNITO_USERNAME=$COGNITO_USERNAME"
    print_status "  SECRET_NAME=$SECRET_NAME"
    print_status "  (GATEWAY_URL and BEARER_TOKEN will be loaded from config.json)"
    
    # Launch with explicit environment variable passing
    # Note: GATEWAY_URL and BEARER_TOKEN are now loaded from config.json
    COGNITO_CLIENT_ID="$COGNITO_CLIENT_ID" \
    COGNITO_USERNAME="$COGNITO_USERNAME" \
    COGNITO_PASSWORD="$COGNITO_PASSWORD" \
    SECRET_NAME="$SECRET_NAME" \
    agentcore launch
    
    print_success "Agent launch initiated"
}

# Function to check deployment status
check_status() {
    print_status "Checking deployment status..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        print_status "Status check attempt $attempt/$max_attempts"
        
        local status_output
        if status_output=$(agentcore status 2>&1); then
            local status=$(echo "$status_output" | jq -r '.endpoint.status // "UNKNOWN"' 2>/dev/null || echo "UNKNOWN")
            
            case "$status" in
                "READY")
                    print_success "Deployment completed successfully!"
                    local endpoint_url=$(echo "$status_output" | jq -r '.endpoint.endpoint_url // "N/A"' 2>/dev/null || echo "N/A")
                    print_success "Runtime endpoint: $endpoint_url"
                    return 0
                    ;;
                "CREATE_FAILED"|"DELETE_FAILED"|"UPDATE_FAILED")
                    print_error "Deployment failed with status: $status"
                    return 1
                    ;;
                *)
                    print_status "Current status: $status (waiting...)"
                    sleep 10
                    ;;
            esac
        else
            print_warning "Status check failed, retrying in 10 seconds..."
            sleep 10
        fi
        
        ((attempt++))
    done
    
    print_error "Deployment status check timed out after $max_attempts attempts"
    return 1
}

# Function to print deployment summary
print_summary() {
    print_status "=== Deployment Summary ==="
    print_status "Region: $AWS_REGION"
    print_status "Agent Name: robot_strands_agent"
    print_status "Entrypoint: main.py"
    print_status "Configuration: config.json"
}

# Main deployment function
main() {
    print_status "Starting Strands Agent Runtime Deployment..."
    
    # Change to the agent-runtime directory
    cd "$(dirname "$0")/.."
    
    # Load configuration
    load_config
    
    # Check prerequisites
    check_prerequisites
    
    # Configure the agent
    configure_agent
    
    # Launch the agent
    launch_agent
    
    # Check deployment status
    if check_status; then
        print_summary
        print_success "Deployment completed successfully!"
        exit 0
    else
        print_error "Deployment failed!"
        exit 1
    fi
}

# Run main function
main "$@"
