import { Construct } from 'constructs'
import { RemovalPolicy } from 'aws-cdk-lib'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { APP_NAME } from './constants'

type TableConfig = {
  name: string
  partitionKey: string
  sortKey?: string
}

type DynamoDbProps = {
  tables: TableConfig[]
}

/**
 * Creates DynamoDB tables from configuration and a basic read/write policy statement for them.
 */
export class DynamoDb extends Construct {
  private tables: Table[]

  constructor(scope: Construct, id: string, { tables }: DynamoDbProps) {
    super(scope, id)

    this.tables = tables.map(({ name, partitionKey, sortKey }) =>
      new Table(this, `ddb-table-${name}`, {
        tableName: `${APP_NAME}_${name}`,
        partitionKey: { name: partitionKey, type: AttributeType.STRING },
        sortKey: sortKey ? { name: sortKey, type: AttributeType.STRING } : undefined,
        removalPolicy: RemovalPolicy.DESTROY,
        billingMode: BillingMode.PROVISIONED,
        readCapacity: 1,
        writeCapacity: 1
      })
    )
  }

  getTables() {
    return this.tables
  }

  getReadWritePolicyStatement() {
    return new PolicyStatement({
      effect: Effect.ALLOW,
      resources: this.tables.map(table => table.tableArn),
      actions: [
        'dynamodb:BatchGetItem',
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:UpdateItem',
        'dynamodb:Scan',
        'dynamodb:Query'
      ]
    })
  }
}
