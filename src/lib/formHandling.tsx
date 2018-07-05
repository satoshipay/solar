import { compose, withHandlers, withState } from 'recompose'

type ErrorValidationResult = Error | null | undefined
type Validator<Values> = (value: any, values: Values) => ErrorValidationResult
interface Validators<Values> { [fieldName: string]: Validator<Values> }

export interface InnerFormProps<Values> {
  errors: {
    [key in keyof Values]: ErrorValidationResult
  },
  formValues: Values,
  setFormValue: (fieldName: string, newValue: string) => any,
  validate: (formValues: Values) => boolean
}

export function addFormState<Values, Props = {}> (options: { defaultValues?: Values, validators?: Validators<Values> } = {}) {
  type ErrorState = { [fieldName in keyof Values]: ErrorValidationResult }
  type ErrorStateUpdater = (prevErrors: ErrorState) => ErrorState

  const defaultValues = options.defaultValues || {} as any as Values
  const validators: Validators<Values> = options.validators || {}

  const validate = (values: Values, { setErrors }: { setErrors: (updater: ErrorStateUpdater) => any }) => {
    let successful = true
    Object.keys(validators).forEach((fieldName: string) => {
      const validator = validators[fieldName]
      const result = validator((values as any)[fieldName], values)
      if (result) {
        setErrors((prevErrors: any) => ({ ...prevErrors, [fieldName]: result }))
        successful = false
      } else {
        setErrors((prevErrors: any) => ({ ...prevErrors, [fieldName]: null }))
      }
    })
    return successful
  }

  return compose<Props & InnerFormProps<Values>, Props>(
    withState('formValues', 'setFormValues', defaultValues),
    withState('errors', 'setErrors', {}),
    withHandlers<{ formValues: Values, setErrors: (errors: ErrorStateUpdater) => any, setFormValues: (values: Values) => any }, { }>({
      setFormValue: ({ formValues, setFormValues }) => (key: string, value: any) => setFormValues({ ...(formValues as any), [key]: value }),
      validate: ({ formValues, setErrors }) => (values = formValues) => validate(values, { setErrors })
    })
  )
}

export function renderError (error: any) {
  if (error) {
    return error instanceof Error ? error.message : error
  } else {
    return error
  }
}
