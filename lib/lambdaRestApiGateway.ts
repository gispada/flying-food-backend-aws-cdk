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
      endpointTypes: [EndpointType.REGIONAL]
    })

    this.createUsagePlan(restApi)

    // Keep track of created resources, so the same resource won't be created multiple times
    const resourcesCache: Record<string, Resource> = {}

    routes.forEach(({ handler, path, methods }) => {
      const [, root, ...pathSegments] = path.split('/')
      const lambdaHandler = this.lambdaManager.createLambda(handler)
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

  createUsagePlan(api: RestApi) {
    const devStage = new Stage(this, 'rest-gw-dev-stage', {
      stageName: 'dev',
      deployment: new Deployment(this, 'dev-deployment', { api }),
      loggingLevel: MethodLoggingLevel.ERROR,
      // accessLogDestination: this.createLogDestination(),
    })

    const usagePlan = api.addUsagePlan('rest-gw-usage-plan', {
      name: 'Academy plan',
      description: 'Usage plan for academy training',
      quota: {
        period: Period.DAY,
        limit: 500
      },
      throttle: {
        burstLimit: 5,
        rateLimit: 10
      }
    })

    usagePlan.addApiKey(this.createApiKey())
    usagePlan.addApiStage({
      stage: devStage
    })

    return usagePlan
  }

}
