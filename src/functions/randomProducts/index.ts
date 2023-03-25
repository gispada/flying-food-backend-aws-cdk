import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoService } from 'dynamo-service'
import { RandomProductsRequest } from 'types/index'
import { Product } from 'types/product.model'
import { getRandomElements } from './utils'

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
  const { productId, count = 4 } = (event.queryStringParameters || {}) as RandomProductsRequest

  const products = await repository.getItems('products') as Product[]

  const targetProduct = productId
    ? products.find(({ id }) => id === productId)
    : undefined

  const commonTags = new Set(targetProduct?.tags)

  const validProducts = products.filter(({ available, id, tags }) => {
    if (!targetProduct) return available
    return id !== targetProduct.id && available && tags.some(t => commonTags.has(t))
  })

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(getRandomElements(validProducts, count))
  }
}
