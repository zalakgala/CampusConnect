export default function Feedback({ kind = 'info', children }) {
  return <p className={`feedback feedback-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</p>;
}

