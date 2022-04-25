import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoService } from 'dynamo-service'
import { CreateOrderRequest } from 'types/index'
import { Product } from 'types/product.model'
import { createOrder, keyBy, getResponse } from './utils'
import { areStockEnough, isValidRequest } from './validation'

const repository = new DynamoService()

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return getResponse(400, { message: 'Invalid request' })
  }

  try {
    const requestBody = JSON.parse(event.body) as CreateOrderRequest

    if (!isValidRequest(requestBody)) {
      throw new Error('Invalid request body')
    }

    const { items } = requestBody

    const productIds = items.map(({ id }) => id)
    const productsToBuy = await repository.getItemsById('products', productIds) as Product[]

    if (productsToBuy.length !== items.length) {
      throw new Error('One or more products in the order are invalid')
    }

    const productsMap = keyBy(productsToBuy, 'id')

    if (!areStockEnough(requestBody, productsMap)) {
      throw new Error('Not enough items to buy')
    }

    const order = createOrder(requestBody, productsMap)

    await Promise.all([
      // Create the order
      repository.createItem('orders', order),
      // Update products' stock
      repository.updateItems('products', order.items.map(({ id, quantity }) => [
        id,
        {
          ExpressionAttributeValues: { ':q': quantity },
          UpdateExpression: 'SET stock = stock - :q'
        }
      ]))
    ])

    return getResponse(201, {
      message: 'Order created successfully',
      orderId: order.id
    })
  } catch (error) {
    console.warn(error)
    return getResponse(500, { message: (error as Error).message })
  }
}
