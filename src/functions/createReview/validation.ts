import { CreateReviewRequest } from "types/index";

const requestSchema: [keyof CreateReviewRequest, string][] = [
  ['productId', 'string'],
  ['author', 'string'],
  ['text', 'string']
]

export const isValidRequest = (body: CreateReviewRequest) => {
  return requestSchema.every(([key, type]) => typeof body[key] === type)
}
