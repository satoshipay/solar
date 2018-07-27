import { observable, IObservableArray } from "mobx"

export interface ErrorItem {
  id: number
  error: any
}

const ErrorsStore: IObservableArray<ErrorItem> = observable([])

export default ErrorsStore

let nextID = 1

export function addError(error: any) {
  ErrorsStore.push({
    id: nextID++,
    error
  })

  // tslint:disable-next-line:no-console
  console.error(error)
}

export function removeErrorByID(errorID: number) {
  const index = ErrorsStore.findIndex(errorItem => errorItem.id === errorID)
  ErrorsStore.splice(index, 1)
}
