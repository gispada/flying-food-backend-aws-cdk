import { Construct } from 'constructs'
import { CorsHttpMethod, HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { LambdaConfig, LambdaManager } from './lambdaManager'

type RouteConfig = {
  path: string,
  methods: HttpMethod[]
  handler: LambdaConfig
}

type ApiGatewayProps = {
  routes: RouteConfig[]
}

/**
 * Creates a HTTP Api Gateway with Lambda integrations from configuration.
 */
export class LambdaApiGateway extends Construct {
  private lambdaManager: LambdaManager

  constructor(scope: Construct, id: string, { routes }: ApiGatewayProps) {
    super(scope, id)

    this.lambdaManager = new LambdaManager(this, 'lambda-manager')

    const httpApi = new HttpApi(this, 'http-api-gw', {
      apiName: 'Flying Food API',
      description: 'Flying Food HTTP gateway with Lambda integration',
      createDefaultStage: false,
      corsPreflight: {
        allowHeaders: ['content-type'],
        allowOrigins: ['*'],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.HEAD,
        ]
      }
    })

    httpApi.addStage('stage-dev', {
      stageName: 'dev',
      autoDeploy: true,
      throttle: {
        burstLimit: 5,
        rateLimit: 10
      }
    })

    routes.forEach(({ handler, ...rest }) => {
      const lambdaHandler = this.lambdaManager.createLambda(handler)
      const integration = new HttpLambdaIntegration(`lambda-${handler.folder}`, lambdaHandler)
      httpApi.addRoutes({ ...rest, integration })
    })
  }
}
