import { observable, IObservableArray } from "mobx"

export interface ErrorItem {
  error: any
  id: number
}

const ErrorsStore: IObservableArray<ErrorItem> = observable([])

export default ErrorsStore

let nextID = 1

function removeErrorByID(errorID: number) {
  const index = ErrorsStore.findIndex(errorItem => errorItem.id === errorID)
  ErrorsStore.splice(index, 1)
}

export function addError(error: any) {
  ErrorsStore.push({
    id: nextID++,
    error
  })

  // just to prevent memory leaks
  setTimeout(() => {
    removeErrorByID(error.id)
  }, 10000)

  // tslint:disable-next-line:no-console
  console.error(error)
}
