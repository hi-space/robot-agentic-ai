# robot-agentic-ai


## Robot의 Feedback

Robot에서 지정된 topic (robo/feedback)으로 feedback에 대한 메시지를 전송하면 IoT Core를 통해 [Lambda](./feedback-manager/lambda-feedback-manager-for-robo/lambda_function.py)에서 수신합니다. 이 메시지는 SQS (fifo)에 순차적으로 기록되면, 이후 client에서 가져다가 활용돕니다. 

[test_feedback.py](./feedback-manager/test_feedback.py)를 이용해 테스트 할 수 있습니다.

```text
python test_feedback.py
```

이때의 결과는 아래와 같습니다.

```text
python test_feedback.py
Reading messages from SQS queue: https://sqs.ap-northeast-2.amazonaws.com/533267442321/robo_feedback.fifo
Press Ctrl+C to stop...
Queue access verified successfully
[2025-09-08 22:27:59.012100] Received 1 message(s):
Message ID: 37211858-c574-4c64-9946-f5b02731209e
Receipt Handle: AQEB+UZkhd15KP6vBrklq9gkTVsQE4G/ahxVrupnVyDPPT/4neGpqHARMSk1SFNp1xXdYwqrD1gdHDzlfZY15xkqn87QjF3rFrM5bVPHeTLFAJPwV2QyssUJnAQLjaywZBfGENCqp/l191c/tUF1BAmfnBI9Kj/8bm5r5Da01m5CjxAyy7qAok5FQZnrNqQTFl/0cZtTTupEw4LDIPHZwGAysd08XwkTdMMGK0rsP6B47gvYxVQsZdrh8g+VkOMQkMgMirb70gUTyblPNRIVPjrymNFsTQ+AvwzsUwaTHvNgktA=
Message Attributes:
  source: iot-core
  timestamp: 4a19c080-9f35-4a89-881d-af0919db9998
Message Body: {
  "message": "Hello 1"
}
```
