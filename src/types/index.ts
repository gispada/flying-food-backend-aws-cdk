export type Resource = 'products' | 'tags' | 'deliveries' | 'orders' | 'reviews'

export type GetItemsRequest = {
  resource?: Resource
  id?: string
}

export type RestockProductsRequest = {
  quantity?: number | string
}

export type RandomProductsRequest = {
  count?: number
  productId?: string
}

export type OrderItem = {
  id: string
  quantity: number
}

export type CreateOrderRequest = {
  userId: string,
  items: OrderItem[]
}

export type ReviewsQueryParams = {
  author?: string
}

export type ReviewsPathParams = {
  productId: string
}

export type CreateReviewRequest = {
  productId: string
  text: string
  author: string
}