# Flying Food backend with AWS CDK

Project for the Flying Food training app backend.

The cloud infrastructure is setup with **AWS CDK**; it's a simple stack with:

- DynamoDB
- Lambda functions (with a shared layer)
- REST API Gateway

## Folders structure

- `src`: business logic source code (functions)
- `lib`: CDK constructs to create the project stack
- `data`: initial data that can be imported into DynamoDB
- `scripts`: useful scripts

## Commands

- `npm run deploy`: compiles the source code and deploys the stack to AWS
- `npm run seed`: populates DynamoDB tables with data inside the `data` folder (it must be run after deploy)
- `cdk destroy`: tears down the stack

> **Note**: `aws-cdk` and `aws-cli` needs to be globally installed and configured.
