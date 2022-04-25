import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoService } from 'dynamo-service'
import { RestockProductsRequest } from 'types/index'

const repository = new DynamoService()

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
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'Products restocked successfully' })
  }
}
