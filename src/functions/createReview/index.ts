import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoService } from 'dynamo-service'
import { CreateReviewRequest } from 'types/index'
import { Review } from 'types/review.model'
import { getResponse } from './utils'
import { isValidRequest } from './validation'

const repository = new DynamoService()

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return getResponse(400, { message: 'Missing request body' })
  }

  try {
    const requestBody = JSON.parse(event.body) as CreateReviewRequest

    if (!isValidRequest(requestBody)) {
      return getResponse(400, { message: 'Invalid request body' })
    }

    const product = await repository.getItemById('products', requestBody.productId)

    if (!product) {
      throw new Error('Cannot create a review for a product that does not exist')
    }

    const review: Review = {
      ...requestBody,
      date: new Date().toISOString()
    }

    await repository.createItem('reviews', review)

    return getResponse(201, {
      message: 'Review created successfully'
    })
  } catch (error) {
    console.warn(error)
    return getResponse(500, { message: (error as Error).message })
  }
}
