import { compose, withHandlers, withState } from 'recompose'

type ErrorValidationResult = any
type Errors = { [fieldName: string]: ErrorValidationResult }
type Values = { [fieldName: string]: any }
type Validator = (value: any) => ErrorValidationResult
type Validators = { [fieldName: string]: Validator }

export function addFormState (options: { defaultValues?: Values, validators?: Validators } = {}) {
  type ErrorState = { [fieldName: string]: ErrorValidationResult }
  type ErrorStateUpdater = (prevErrors: ErrorState) => ErrorState

  const defaultValues: Values = options.defaultValues || {}
  const validators: Validators = options.validators || {}

  const validate = (values: Values, { setErrors }: { setErrors: (updater: ErrorStateUpdater) => any }) => {
    let successful = true
    Object.keys(validators).forEach((fieldName: string) => {
      const validator = validators[fieldName] as Validator
      const result = validator(values[fieldName])
      if (result) {
        setErrors(prevErrors => ({ ...prevErrors, [fieldName]: result }))
        successful = false
      } else {
        setErrors(prevErrors => ({ ...prevErrors, [fieldName]: null }))
      }
    })
    return successful
  }

  return compose(
    withState('formValues', 'setFormValues', defaultValues),
    withState('errors', 'setErrors', {}),
    withHandlers<{ formValues: Values, setErrors: (errors: Errors) => any, setFormValues: (values: Values) => any }, { }>({
      setFormValue: ({ formValues, setFormValues }) => (key: string, value: any) => setFormValues({ ...formValues, [key]: value }),
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
