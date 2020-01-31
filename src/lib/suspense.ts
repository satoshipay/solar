/**
 * Works like the usual Array.prototype.map(), but doesn't suspend the whole
 * iteration once the first element suspends, but always runs the mapper on
 * all elements and throws a Promise.all([…]) after the iteration.
 */
export function mapSuspendables<In, Out>(
  array: In[],
  mapper: (input: In, index: number) => Out,
  options: {
    ignoreSingleErrors?: boolean
  } = {}
): Out[] {
  const pendingSuspenses: Array<Promise<any>> = []
  const rejections: Error[] = []

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
    throw options.ignoreSingleErrors
      ? Promise.all([
          ...pendingSuspenses.map(promise =>
            promise.catch(error => {
              rejections.push(error)
            })
          )
        ]).then(results => {
          if (rejections.length > 0 && rejections.length === array.length) {
            throw rejections[0]
          } else {
            return results
          }
        })
      : Promise.all(pendingSuspenses)
  }

  return result as Out[]
}
