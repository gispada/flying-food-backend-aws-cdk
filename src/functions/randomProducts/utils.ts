// Durstenfeld's shuffle algorithm
const shuffleInPlace = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

export const getRandomElements = <T>(array: T[], count: number) => {
  shuffleInPlace(array)
  return array.slice(0, count)
}
