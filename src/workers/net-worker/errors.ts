import { Observable, Subject } from "observable-fns"

export const enum ServiceID {
  HorizonPublic = "HorizonPublic",
  HorizonTestnet = "HorizonTestnet",
  MultiSignature = "MultiSignature"
}

export interface ConnectionErrorDescription {
  message: string
  service: ServiceID
}

export interface ConnectionErrorResolution {
  clearError: true
  service: ServiceID
}

export type ConnectionErrorEvent = ConnectionErrorDescription | ConnectionErrorResolution

const connectionErrorsSubject = new Subject<ConnectionErrorEvent>()

export const Exposed = {
  connectionErrors: () => Observable.from(connectionErrorsSubject)
}

export function raiseConnectionError(error: Error, service: ServiceID) {
  // tslint:disable-next-line no-console
  console.error("Connection error:", error)

  connectionErrorsSubject.next({
    message: error.message,
    service
  })

  return () => {
    connectionErrorsSubject.next({
      clearError: true,
      service
    })
  }
}
