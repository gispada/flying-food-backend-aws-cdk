import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoService } from 'dynamo-service'
import { ReviewsPathParams, ReviewsQueryParams } from 'types/index'

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
  const { productId } = (event.pathParameters || {}) as ReviewsPathParams
  const { author } = (event.queryStringParameters || {}) as ReviewsQueryParams

  if (!productId) {
    return { statusCode: 400, body: 'Missing productId parameter' }
  }

  const results = await repository.queryItems('reviews', {
    KeyConditionExpression: `productId = :productId${author ? ' AND author = :author' : ''}`,
    ExpressionAttributeValues: {
      ':productId': productId, // Partition key
      ':author': author // Sort key
    }
  })

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(results)
  }
}
