import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoService } from 'dynamo-service'
import { RestockProductsRequest } from 'types/index'

const repository = new DynamoService()

const headers = {
  'content-type': 'application/json',
  'access-control-allow-headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'OPTIONS,GET'
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return { statusCode: 400, body: 'Invalid request' }
  }

  const { quantity = 10 } = JSON.parse(event.body) as RestockProductsRequest

  const q = typeof quantity === 'string'
    ? parseInt(quantity, 10)
    : quantity

  await repository.updateAllItems('products', {
    ExpressionAttributeValues: {
      ':q': Math.min(q, 50)
    },
    UpdateExpression: 'SET stock = stock + :q'
  })

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Products restocked successfully' })
  }
}
