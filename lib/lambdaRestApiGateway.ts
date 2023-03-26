import { Construct } from 'constructs'
import {
  RestApi,
  LambdaIntegration,
  Period,
  ApiKey,
  Deployment,
  Stage,
  Resource,
  EndpointType,
  LogGroupLogDestination,
  MethodLoggingLevel,
  Cors
} from 'aws-cdk-lib/aws-apigateway'
import { LambdaConfig, LambdaManager } from './lambdaManager'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { APP_NAME } from './constants'

type RouteConfig = {
  path: string,
  methods: string[]
  handler: LambdaConfig
}

type ApiGatewayProps = {
  routes: RouteConfig[]
}

/**
 * Creates a HTTP Api Gateway with Lambda integrations from configuration.
 */
export class LambdaRestApiGateway extends Construct {
  private lambdaManager: LambdaManager

  constructor(scope: Construct, id: string, { routes }: ApiGatewayProps) {
    super(scope, id)

    this.lambdaManager = new LambdaManager(this, 'lambda-manager')

    const restApi = new RestApi(this, 'rest-api-gw', {
      restApiName: 'Flying Food REST API',
      description: 'Flying Food REST API gateway with Lambda integration',
      endpointTypes: [EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS
      }
    })

    this.createUsagePlan(restApi)

    // Keep track of created resources, so the same resource won't be created multiple times
    const resourcesCache: Record<string, Resource> = {}

    routes.forEach(({ handler, path, methods }) => {
      const [, root, ...pathSegments] = path.split('/')
      const lambdaHandler = this.lambdaManager.createLambda(handler)
      // lambdaHandler.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'))
      
      let resource = resourcesCache[root] ??= restApi.root.addResource(root)

      for (const segment of pathSegments) {
        resource = resourcesCache[segment] ??= resource.addResource(segment)
      }

      for (const method of methods) {
        resource.addMethod(method, new LambdaIntegration(lambdaHandler), {
          apiKeyRequired: true
        })
      }
    })
  }

  createApiKey() {
    return new ApiKey(this, 'academy-key', { apiKeyName: 'Academy API Key' })
  }

  createLogDestination() {
    const logGroup = new LogGroup(this, 'rest-api-gw-log-group', {
      logGroupName: `${APP_NAME}_rest-api-gateway`,
      retention: RetentionDays.ONE_WEEK,
    })
    return new LogGroupLogDestination(logGroup)
  }

  createStage(name: string, deployment: Deployment) {
    return new Stage(this, `rest-gw-${name}-stage`, {
      stageName: name,
      deployment,
      loggingLevel: MethodLoggingLevel.ERROR,
      throttlingRateLimit: 100,
      throttlingBurstLimit: 100
    })
  }

  createUsagePlan(api: RestApi) {
    // const deployment = new Deployment(this, 'rest-api-gw-deployment', { api })
    // const devStage = this.createStage('dev', deployment)

    const usagePlan = api.addUsagePlan('rest-gw-usage-plan', {
      name: 'Academy plan',
      description: 'Usage plan for academy training',
      quota: {
        period: Period.DAY,
        limit: 2000
      },
      throttle: {
        burstLimit: 5,
        rateLimit: 10
      }
    })

    usagePlan.addApiKey(this.createApiKey())
    // usagePlan.addApiStage({ stage: devStage })
    usagePlan.addApiStage({ stage: api.deploymentStage }) // Default prod stage

    return usagePlan
  }

}
