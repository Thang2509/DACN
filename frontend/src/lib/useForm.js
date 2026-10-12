import { useState } from 'react'

// Quản lý giá trị form: <Input {...bind('email')} />
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues)

  const bind = (field) => ({
    value: values[field] ?? '',
    onChange: (e) => setValues((current) => ({ ...current, [field]: e.target.value })),
  })

  return { values, setValues, bind }
}
