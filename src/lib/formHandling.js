import { compose, withHandlers, withState } from 'recompose'

export function addFormState ({ defaultValues = {}, validators = {} } = {}) {
  const validate = (values, { setErrors }) => {
    let successful = true
    Object.keys(validators).forEach(fieldName => {
      const validator = validators[fieldName]
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
    withHandlers({
      setFormValue: ({ formValues, setFormValues }) => (key, value) => setFormValues({ ...formValues, [key]: value }),
      validate: ({ formValues, setErrors }) => (values = formValues) => validate(values, { setErrors })
    })
  )
}

export function renderError (error) {
  if (error) {
    return error instanceof Error ? error.message : error
  } else {
    return error
  }
}
