import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoService } from 'dynamo-service'
import { GetItemsRequest } from 'types/index'

const repository = new DynamoService()

// Need to explicitly set CORS headers with REST API Gateway
const headers = {
  'content-type': 'application/json',
  'access-control-allow-headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'OPTIONS,GET'
}

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
