type ValueType = {
  type: string
  value: number
}

export type Product = {
  id: string,
  name: string,
  description: string,
  available: boolean,
  new: boolean,
  stock: number,
  rating: number,
  delivery: string,
  discountRate: number | null,
  price: ValueType,
  size: ValueType,
  tags: string[],
  imageUrl: string
}
