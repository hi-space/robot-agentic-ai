# Chat Suggestions with Bedrock AgentCore Memory

This Lambda function provides chat suggestions based on conversation history stored in Bedrock AgentCore memory instead of DynamoDB.

## Features

- **Bedrock AgentCore Memory Integration**: Uses Amazon Bedrock AgentCore memory to store and retrieve conversation history
- **Fallback to DynamoDB**: If memory is unavailable, falls back to DynamoDB for backward compatibility
- **Contextual Suggestions**: Generates intelligent suggestions based on recent conversation patterns
- **Korean Language Support**: Optimized for Korean conversation patterns

## Architecture

```
User Request → Lambda Function → Bedrock AgentCore Memory → Contextual Suggestions
                    ↓
              (Fallback to DynamoDB if memory fails)
```

## Environment Variables

- `AWS_REGION`: AWS region for Bedrock services (default: us-east-1)
- `MEMORY_NAME`: Name of the memory resource (default: ChatSuggestionsMemory)
- `CHAT_HISTORY_TABLE`: DynamoDB table name for fallback (default: ChatHistory)

## Dependencies

- `boto3`: AWS SDK for Python
- `bedrock-agentcore`: Amazon Bedrock AgentCore SDK

## API Usage

### Request Format

```json
{
  "session_id": "unique-session-identifier",
  "limit": 5
}
```

### Response Format

```json
{
  "session_id": "unique-session-identifier",
  "suggestions": [
    "로봇이 인사해줘",
    "로봇이 춤춰줘",
    "로봇이 앞으로 점프해줘"
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Memory Integration

The function automatically:

1. **Creates Memory Resource**: If the specified memory doesn't exist, it creates a new one
2. **Stores Conversations**: Each conversation turn is stored as an event in memory
3. **Retrieves History**: Fetches recent conversation history for contextual suggestions
4. **Handles Errors**: Falls back to DynamoDB if memory operations fail

## Testing

Run the test script to verify the integration:

```bash
python test_memory_integration.py
```

## Deployment

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set environment variables in your Lambda configuration

3. Deploy the function to AWS Lambda

## Memory Management

The memory service automatically manages:
- Memory resource creation and retrieval
- Event storage with proper formatting
- Conversation history retrieval with sorting
- Error handling and logging

## Benefits over DynamoDB

- **Better Context Understanding**: Bedrock AgentCore memory provides better semantic understanding
- **Automatic Memory Management**: No need to manually manage conversation storage
- **Enhanced Retrieval**: More intelligent conversation history retrieval
- **Scalability**: Better performance for large conversation histories
