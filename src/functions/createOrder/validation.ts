import { CreateOrderRequest, OrderItem } from 'types/index'
import { Product } from 'types/product.model'

const requestItemSchema: [keyof OrderItem, string][] = [
  ['id', 'string'],
  ['quantity', 'number']
]

export const isValidRequest = ({ items, userId }: CreateOrderRequest) => {
  if (!userId || !(Array.isArray(items) && items.length > 0)) return false
  return items.every(item =>
    requestItemSchema.every(([key, type]) => typeof item[key] === type)
  )
}

export const areStockEnough = (
  { items }: CreateOrderRequest,
  productsMap: Record<string, Product>
) => {
  return items.every(({ id, quantity }) => productsMap[id].stock - quantity > 0)
}
