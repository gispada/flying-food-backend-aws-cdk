#!/usr/bin/env node
import 'source-map-support/register'
import { App } from 'aws-cdk-lib'
import { FlyingFoodBackendStack } from '../lib/flying-food-backend-stack'

const app = new App()

new FlyingFoodBackendStack(app, 'FlyingFoodBackendStack', {
  description: 'Stack for the Flying Food training app',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
})
