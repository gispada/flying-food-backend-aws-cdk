import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoService } from 'dynamo-service'
import { GetItemsRequest } from 'types/index'

const repository = new DynamoService()

const headers = { 'content-type': 'application/json' }

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { resource, id } = (event.pathParameters || {}) as GetItemsRequest

  if (!resource) {
    return { statusCode: 404, body: 'Not found' }
  }

  if (id) {
    const item = await repository.getItemById(resource, id)
    return {
      statusCode: item ? 200 : 404,
      headers,
      body: JSON.stringify(item || { message: 'Not found' })
    }
  }

  const items = await repository.getItems(resource)
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(items)
  }
}
