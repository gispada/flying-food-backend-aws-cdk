export const getRandomElements = <T>(array: T[], count: number) => {
  const result = []
  const seenIndexes = new Set()
  const target = array.length < count ? array.length : count

  while (result.length < target) {
    const randomIndex = Math.floor(Math.random() * array.length)
    if (seenIndexes.has(randomIndex)) continue
    seenIndexes.add(randomIndex)
    result.push(array[randomIndex])
  }

  return result
}
