import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoService } from 'dynamo-service'
import { RandomProductsRequest } from 'types/index'
import { Product } from 'types/product.model'
import { getRandomElements } from './utils'

const repository = new DynamoService()

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
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(getRandomElements(validProducts, count))
  }
}
