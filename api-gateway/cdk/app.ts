#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RobotAgenticApiStack } from './lib/robot-agentic-api-stack';

const app = new cdk.App();

new RobotAgenticApiStack(app, 'RobotAgenticApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Robot Agentic API - API Gateway and Lambda functions',
});

app.synth();
