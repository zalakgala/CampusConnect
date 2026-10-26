export default function EventCard({ event, onRegister }) {
  const date = new Date(event.date);
  return <article className="event-card">
    <div className="event-date"><span>{date.toLocaleDateString('en', { month: 'short' })}</span><strong>{date.toLocaleDateString('en', { day: '2-digit' })}</strong></div>
    <div className="event-copy"><span className="eyebrow event-category">{event.category}</span><h3>{event.name}</h3><p>{event.description}</p>
      <div className="event-meta"><span><span aria-hidden="true">⌖</span> {event.venue}</span><span>{date.toLocaleDateString('en', { weekday: 'long', hour: 'numeric', minute: '2-digit' })}</span></div>
    </div>
    <button className="text-link event-action" type="button" onClick={() => onRegister(event._id)}>Save me a seat <span aria-hidden="true">↗</span></button>
  </article>;
}

