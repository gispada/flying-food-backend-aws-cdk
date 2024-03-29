import { join } from 'path'
import { Construct } from 'constructs'
import { Stack, StackProps } from 'aws-cdk-lib'
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam'
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda'
import { HttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha'
import { DynamoDb } from './dynamoDb'
// import { LambdaApiGateway } from './lambdaApiGateway'
import { LambdaRestApiGateway } from './lambdaRestApiGateway'
import { APP_NAME, LAYERS_PATH } from './constants'

export class FlyingFoodBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const dynamoDb = new DynamoDb(this, 'ddb-tables', {
      tables: [
        {
          name: 'products',
          partitionKey: 'id',
        },
        {
          name: 'tags',
          partitionKey: 'id',
        },
        {
          name: 'deliveries',
          partitionKey: 'id',
        },
        {
          name: 'orders',
          partitionKey: 'id',
          sortKey: 'userId'
        },
        {
          name: 'reviews',
          partitionKey: 'productId',
          sortKey: 'author'
        }
      ]
    })

    const dynamoDbPolicy = this.createManagedDynamoDbPolicy(dynamoDb)
    const dynamoDbLayer = this.createDynamoDbLambdaLayer()

    const getItemsHandler = {
      folder: 'getItems',
      description: 'Get all resource items or a specific resource item by id',
      policies: [dynamoDbPolicy],
      layers: [dynamoDbLayer]
    }

    new LambdaRestApiGateway(this, 'lambda-api-gateway', {
      routes: [
        {
          path: '/{resource}',
          methods: [HttpMethod.GET],
          handler: getItemsHandler
        },
        {
          path: '/{resource}/{id}',
          methods: [HttpMethod.GET],
          handler: getItemsHandler
        },
        {
          path: '/products/random',
          methods: [HttpMethod.GET],
          handler: {
            folder: 'randomProducts',
            description: 'Get a subset of products in random order',
            policies: [dynamoDbPolicy],
            layers: [dynamoDbLayer]
          }
        },
        {
          path: '/order',
          methods: [HttpMethod.POST],
          handler: {
            folder: 'createOrder',
            description: "Create a new order and updates products' stock",
            policies: [dynamoDbPolicy],
            layers: [dynamoDbLayer]
          }
        },
        {
          path: '/products/restock',
          methods: [HttpMethod.POST],
          handler: {
            folder: 'restockProducts',
            description: "Increase all products' stock by the specified amount",
            policies: [dynamoDbPolicy],
            layers: [dynamoDbLayer]
          }
        },
        {
          path: '/reviews/{productId}',
          methods: [HttpMethod.GET],
          handler: {
            folder: 'getReviews',
            description: 'Get all reviews for the specified product',
            policies: [dynamoDbPolicy],
            layers: [dynamoDbLayer]
          }
        },
        {
          path: '/reviews',
          methods: [HttpMethod.POST],
          handler: {
            folder: 'createReview',
            description: 'Create a review for the specified product',
            policies: [dynamoDbPolicy],
            layers: [dynamoDbLayer]
          }
        }
      ]
    })
  }

  // This module will be shared across lambdas
  createDynamoDbLambdaLayer() {
    return new LayerVersion(this, 'ddb-lambda-layer', {
      layerVersionName: `${APP_NAME}_dynamodb-layer`,
      description: 'Shared DynamoDB repository service',
      code: Code.fromAsset(join(__dirname, `../${LAYERS_PATH}/dynamoService`)),
      compatibleRuntimes: [Runtime.NODEJS_16_X]
    })
  }

  createManagedDynamoDbPolicy(dynamoDb: DynamoDb) {
    return new ManagedPolicy(this, 'ddb-read-write-policy', {
      managedPolicyName: `${APP_NAME}_dynamodb-read-write`,
      description: 'Basic read/write policy for Flying Food DynamoDB tables',
      statements: [dynamoDb.getReadWritePolicyStatement()]
    })
  }
}
