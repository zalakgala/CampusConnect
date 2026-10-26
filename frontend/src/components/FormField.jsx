export default function FormField({ label, name, error, hint, as = 'input', children, ...props }) {
  const controlId = `field-${name}`;
  const shared = { id: controlId, name, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined, ...props };
  return <div className="form-field"><label htmlFor={controlId}>{label}</label>
    {as === 'textarea' ? <textarea {...shared}>{children}</textarea> : as === 'select' ? <select {...shared}>{children}</select> : <input {...shared} />}
    {error ? <span className="field-error" id={`${controlId}-error`} role="alert">{error}</span> : hint ? <span className="field-hint" id={`${controlId}-hint`}>{hint}</span> : null}
  </div>;
}

