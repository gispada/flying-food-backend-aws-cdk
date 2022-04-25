import { join } from 'path'
import { Construct } from 'constructs'
import { Runtime, Code, Function, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { kebabCase } from 'lodash'
import { APP_NAME, FUNCTIONS_PATH } from './constants'

export type LambdaConfig = {
  folder: string,
  id?: string,
  description?: string,
  policies?: ManagedPolicy[],
  layers?: LayerVersion[]
}

/**
 * Manages and simplifies the creation of Lambda functions.
 */
export class LambdaManager extends Construct {
  private functionsMap: Record<string, Function> = {}

  constructor(scope: Construct, id: string) {
    super(scope, id)
  }

  createLambda(config: LambdaConfig) {
    const functionId = this.getFunctionId(config)
    return this.functionsMap[functionId] ??= this._createLambda(config)
  }

  getFunctionId({ id, folder }: LambdaConfig) {
    return `${APP_NAME}_${id || kebabCase(folder)}`
  }

  private _createLambda(config: LambdaConfig) {
    const { folder, layers, description } = config

    const functionId = this.getFunctionId(config)

    return new Function(this, functionId, {
      functionName: functionId,
      code: Code.fromAsset(join(__dirname, `../${FUNCTIONS_PATH}/${folder}`)),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_14_X,
      role: this.createRole(config),
      logRetention: RetentionDays.ONE_WEEK,
      description,
      layers
    })
  }

  private createRole(config: LambdaConfig) {
    const roleId = `${this.getFunctionId(config)}-role`

    return new Role(this, roleId, {
      roleName: roleId,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ...(config.policies || [])
      ]
    })
  }
}
