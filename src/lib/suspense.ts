/**
 * Works like the usual Array.prototype.map(), but doesn't suspend the whole
 * iteration once the first element suspends, but always runs the mapper on
 * all elements and throws a Promise.all([…]) after the iteration.
 */
export function mapSuspendables<In, Out>(array: In[], mapper: (input: In, index: number) => Out): Out[] {
  const pendingSuspenses: Array<Promise<any>> = []

  const result = array.map((element, index) => {
    try {
      return mapper(element, index)
    } catch (thrown) {
      if (thrown && typeof thrown.then === "function") {
        pendingSuspenses.push(thrown)
      } else {
        throw thrown
      }
    }
  })

  if (pendingSuspenses.length > 0) {
    throw pendingSuspenses.length === 1 ? pendingSuspenses[0] : Promise.all(pendingSuspenses)
  }

  return result as Out[]
}
