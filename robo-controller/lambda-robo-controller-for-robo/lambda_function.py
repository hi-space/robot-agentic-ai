import json
import boto3
import os
import traceback

bedrock_agent_runtime_client = boto3.client("bedrock-agent-runtime")

topic = os.environ.get('TOPIC', 'robot/control')

def command_robot(action: str, message: str) -> str:
    client = boto3.client(
        'iot-data',
        region_name='ap-northeast-2'
    )        
    print('action: ', action)

    say = ""
    if message:
        print('message: ', message)
        say = message
    
    move = ""
    if action == "탐지" or action == "detected":
        move = ['detected']
    elif action == "from1to2":
        move = ['from1to2']
    elif action == "from3to0":
        move = ['from3to0']
    elif action == "from0to1":
        move = ['from0to1']
    elif action == "normal":
        move = ['normal']
    elif action == "stop_move":
        move = ['stop_move']
    elif action == "stand":
        move = ['stand']
    elif action == "sit":
        move = ['sit']
    elif action == "hello":
        move = ['hello']
    elif action == "stretch":
        move = ['stretch']
    elif action == "scrape":
        move = ['scrape']
    elif action == "heart":
        move = ['heart']
    elif action == "dance1":
        move = ['dance1']
    elif action == "dance2":
        move = ['dance2']
    else:
        move = [action]
    
    if say:
        payload = json.dumps({
            "move": move,
            "say": say, 
        })
    else:
        payload = json.dumps({
            "move": move
        })
                        
    print('topic: ', topic)

    try:         
        response = client.publish(
            topic = topic,
            qos = 1,
            payload = payload
        )
        print('response: ', response)     
        return True   
            
    except Exception:
        err_msg = traceback.format_exc()
        print('error message: ', err_msg)                    
        return False

def lambda_handler(event, context):
    print(f"event: {event}")
    print(f"context: {context}")

    action = event.get('action')
    print(f"action: {action}")
    message = event.get('message')
    print(f"message: {message}")

    result = command_robot(action, message)
    print(f"result: {result}")
    return {
        'statusCode': 200, 
        'body': result
    }
