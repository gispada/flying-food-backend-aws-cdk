// @ts-ignore
import { util } from 'aws-sdk'
import { CreateOrderRequest } from 'types/index'
import { Product } from 'types/product.model'

export const keyBy = <T extends Record<string, any>>(array: T[], key: keyof T) =>
  array.reduce((acc, item) => ({ ...acc, [item[key]]: item }), {} as Record<string, T>)

export const createOrder = (
  { items, userId }: CreateOrderRequest,
  productsMap: Record<string, Product>
) => {
  const itemsWithPrice = items.map(({ id, quantity }) => {
    const product = productsMap[id]
    const { price, discountRate, delivery } = product
    const finalPrice = {
      ...price,
      value: price.value * (1 - (discountRate ?? 0))
    }
    return { id, quantity, price: finalPrice, delivery }
  })

  return {
    id: util.uuid.v4() as string,
    userId: userId,
    date: new Date().toISOString(),
    items: itemsWithPrice
  }
}

export const getResponse = (statusCode: number, body: any) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
})
