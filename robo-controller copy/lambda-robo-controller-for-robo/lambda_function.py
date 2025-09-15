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
    
    show = move = seq = ""
    if action == "HAPPY":
        show = 'HAPPY'
        move = 'seq'
        seq = ["MOVE_FORWARD", "SIT", "MOVE_BACKWARD"]
    elif action == "NEUTRAL":
        show = 'NEUTRAL'
        move = 'seq'
        seq = ["TURN_LEFT", "SIT", "TURN_RIGHT"]
    elif action == "SAD":
        show = 'SAD'
        move = 'seq'
        seq = ["MOVE_BACKWARD", "SIT", "MOVE_FORWARD"]
    elif action == "ANGRY":
        show = 'ANGRY'
        move = 'seq'
        seq = ["LOOK_LEFT","LOOK_RIGHT", "LOOK_LEFT", "LOOK_RIGHT"]
    else:
        show = 'HAPPY'
        move = 'seq'
        seq = ["MOVE_FORWARD", "SIT", "MOVE_BACKWARD"]

    if say:
        payload = json.dumps({
            "show": show,  
            "move": move, 
            "seq": seq,
            "say": say, 
        })
    else:
        payload = json.dumps({
            "show": show,  
            "move": move, 
            "seq": seq
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
