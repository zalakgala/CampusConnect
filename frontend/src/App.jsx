import { useEffect, useState } from 'react';
import { apiRequest } from './api.js';
import { Router, Link, useLocation } from './router.jsx';
import { Header, Footer } from './components/SiteLayout.jsx';
import FormField from './components/FormField.jsx';
import EventCard from './components/EventCard.jsx';
import Feedback from './components/Feedback.jsx';
import { readSession, saveSession, clearSession } from './auth.js';

const categories = ['Academic', 'Arts & Culture', 'Career', 'Community', 'Sports', 'Workshop'];
const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const dateInput = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = async () => {
    setLoading(true); setError('');
    try { const data = await apiRequest('/events'); setEvents(data.events); }
    catch (issue) { setError(issue.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);
  return { events, loading, error, reload };
}

function HomePage() {
  const { events, loading } = useEvents();
  const upcoming = events.slice(0, 2);
  return <main>
    <section className="hero"><div className="hero-inner wrap"><div className="hero-copy"><p className="eyebrow"><span className="tiny-star">✳</span> Your campus, a little closer</p><h1>Good things<br />happen when<br /><em>we show up.</em></h1><p className="hero-intro">Find the little moments, big ideas, and new friends hiding in your campus calendar.</p><div className="hero-actions"><Link to="/events" className="button button-dark">See what’s on <span aria-hidden="true">↗</span></Link><Link to="/add-event" className="quiet-link">Have an idea? Add it <span aria-hidden="true">→</span></Link></div></div>
      <div className="hero-art" aria-label="Illustration of a campus noticeboard"><div className="sunburst">✳</div><div className="poster"><span className="poster-top">ON CAMPUS / TOGETHER</span><span className="poster-words">Make<br />room for<br /><i>something</i><br />new.</span><span className="poster-bottom">STUDENT LIFE CLUB · THIS WEEK</span></div><div className="art-note note-one">meet me<br />there ↗</div><div className="art-note note-two">★</div><div className="art-doodle">✳</div></div>
    </div><div className="hero-bottom wrap"><span>Made by students, for students</span><span className="scroll-cue">Take a look <span aria-hidden="true">↓</span></span></div></section>
    <section className="home-events wrap"><div className="section-heading"><div><p className="eyebrow">A few good reasons to get out</p><h2>Coming up <em>on campus</em></h2></div><Link to="/events" className="text-link">All events <span aria-hidden="true">↗</span></Link></div>
      {loading ? <p className="muted">Finding the next good thing…</p> : upcoming.length ? <div className="home-event-list">{upcoming.map((event) => <EventCard key={event._id} event={event} onRegister={() => window.dispatchEvent(new CustomEvent('campusconnect:navigate', { detail: '/events' }))} />)}</div> : <p className="muted">Nothing on the calendar just yet. <Link to="/add-event" className="inline-link">Start something</Link>.</p>}
    </section>
    <section className="invite-band"><div className="wrap invite-inner"><span className="invite-mark">✳</span><div><p className="eyebrow">The best plans start somewhere</p><h2>Got a good idea?</h2><p>Bring your club, your playlist, your questionable baking skills. We’ll help get the word out.</p></div><Link to="/add-event" className="button button-light">Put it on the calendar <span aria-hidden="true">↗</span></Link></div></section>
  </main>;
}

function RegistrationForm({ events, selectedEvent, account, onDone }) {
  const [values, setValues] = useState({ name: account.name, email: account.email, department: account.department, year: String(account.year), eventId: selectedEvent || '' });
  const [errors, setErrors] = useState({}); const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => setValues((current) => ({ ...current, eventId: selectedEvent || current.eventId })), [selectedEvent]);
  const change = (event) => { setValues({ ...values, [event.target.name]: event.target.value }); setErrors({ ...errors, [event.target.name]: '' }); setStatus(''); };
  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (values.name.trim().length < 2 || values.name.trim().length > 80) next.name = 'Use 2–80 characters.';
    if (!emailOk(values.email) || values.email.length > 254) next.email = 'Enter a valid email address.';
    if (values.department.trim().length < 2 || values.department.trim().length > 80) next.department = 'Use 2–80 characters.';
    if (!['1', '2', '3', '4'].includes(values.year)) next.year = 'Choose your year of study.';
    if (!events.some((item) => item._id === values.eventId)) next.eventId = 'Choose an available event.';
    setErrors(next); setStatus(''); if (Object.keys(next).length) return;
    setBusy(true);
    try { const result = await apiRequest('/registrations', { method: 'POST', body: values }); setStatus(result.message); setValues({ name: account.name, email: account.email, department: account.department, year: String(account.year), eventId: values.eventId }); onDone?.(); }
    catch (issue) { setErrors(issue.fields || {}); setStatus(issue.fields && Object.keys(issue.fields).length ? '' : issue.message); }
    finally { setBusy(false); }
  };
  return <form className="form-card" onSubmit={submit} noValidate><div className="form-grid">
    <FormField label="Your name" name="name" value={values.name} onChange={change} error={errors.name} autoComplete="name" maxLength={80} required readOnly />
    <FormField label="Email address" name="email" type="email" value={values.email} onChange={change} error={errors.email} autoComplete="email" maxLength={254} required readOnly />
    <FormField label="Department" name="department" value={values.department} onChange={change} error={errors.department} maxLength={80} placeholder="e.g. Environmental Science" required readOnly />
    <FormField as="select" label="Year of study" name="year" value={values.year} onChange={change} error={errors.year} required disabled><option value="">Choose your year</option>{[1, 2, 3, 4].map((year) => <option key={year} value={year}>{year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} year</option>)}</FormField>
    <FormField as="select" label="Event" name="eventId" value={values.eventId} onChange={change} error={errors.eventId} required><option value="">Choose an event</option>{events.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</FormField>
  </div>{status && <Feedback kind="success">{status}</Feedback>}<button className="button button-dark" disabled={busy || !events.length}>{busy ? 'Saving your place…' : 'Register for this event'} <span aria-hidden="true">↗</span></button></form>;
}

function EventsPage({ account }) {
  const { events, loading, error, reload } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState('');
  const register = (id) => { setSelectedEvent(id); window.setTimeout(() => document.getElementById('registration')?.scrollIntoView({ behavior: 'smooth' }), 20); };
  return <main className="page-main"><section className="page-intro wrap"><p className="eyebrow">Your calendar, with better company</p><h1>Things to do.<br /><em>People to meet.</em></h1><p>Workshops, club nights, small beginnings. There’s a seat for you here.</p></section>
    <section className="event-list-section wrap"><div className="section-heading compact"><div><p className="eyebrow">The campus noticeboard</p><h2>Coming up</h2></div><span className="list-count">{loading ? '…' : `${events.length} ${events.length === 1 ? 'event' : 'events'}`}</span></div>
      {loading ? <Feedback>Events are on their way…</Feedback> : error ? <div><Feedback kind="error">{error}</Feedback><button className="text-link" onClick={reload}>Try again ↗</button></div> : events.length ? <div className="event-list">{events.map((event) => <EventCard key={event._id} event={event} onRegister={register} />)}</div> : <div className="empty-state"><span aria-hidden="true">✳</span><h3>A little quiet around here.</h3><p>Be the first to put something good on the calendar.</p><Link to="/add-event" className="button button-dark">Add an event ↗</Link></div>}
    </section>
    <section className="registration-section" id="registration"><div className="wrap registration-inner"><div className="registration-copy"><p className="eyebrow">Pull up a chair</p><h2>Save your<br /><em>place.</em></h2><p>Sign in with your student account and we’ll put your name on the list. Already signed up? No double-dipping, please.</p></div><div className="registration-form"><h3>Student registration</h3>{account?.role === 'student' ? events.length ? <RegistrationForm events={events} selectedEvent={selectedEvent} account={account} /> : <Feedback kind={error ? 'error' : 'info'}>{error || 'Add an event first and then come back to save your place.'}</Feedback> : <div className="signin-prompt"><Feedback>{account ? 'Student accounts can register for events.' : 'Sign in or create a student account to save your place.'}</Feedback><Link className="button button-dark" to="/login">Student sign in ↗</Link></div>}</div></div></section>
  </main>;
}

function AddEventPage({ account }) {
  const [values, setValues] = useState({ name: '', description: '', date: '', venue: '', category: '' });
  const [errors, setErrors] = useState({}); const [message, setMessage] = useState(''); const [kind, setKind] = useState('success'); const [busy, setBusy] = useState(false);
  const change = (event) => { setValues({ ...values, [event.target.name]: event.target.value }); setErrors({ ...errors, [event.target.name]: '' }); setMessage(''); };
  const submit = async (event) => {
    event.preventDefault(); const next = {};
    if (values.name.trim().length < 3 || values.name.trim().length > 100) next.name = 'Use 3–100 characters.';
    if (values.description.trim().length < 10 || values.description.trim().length > 1000) next.description = 'Use 10–1,000 characters.';
    if (!values.date || new Date(values.date) <= new Date()) next.date = 'Choose a date and time in the future.';
    if (values.venue.trim().length < 2 || values.venue.trim().length > 120) next.venue = 'Use 2–120 characters.';
    if (!categories.includes(values.category)) next.category = 'Choose a category.';
    setErrors(next); setMessage(''); if (Object.keys(next).length) return;
    setBusy(true);
    try { const result = await apiRequest('/events', { method: 'POST', body: values }); setMessage(result.message); setKind('success'); setValues({ name: '', description: '', date: '', venue: '', category: '' }); }
    catch (issue) { setErrors(issue.fields || {}); setMessage(issue.fields && Object.keys(issue.fields).length ? '' : issue.message); setKind('error'); }
    finally { setBusy(false); }
  };
  if (account?.role !== 'committee') return <AccessRequired message="Event posting is for committee accounts. Sign in with your committee login to add an event." />;
  return <main className="page-main"><section className="page-intro wrap narrow-intro"><p className="eyebrow">A good idea belongs on the calendar</p><h1>Make a little<br /><em>room for it.</em></h1><p>Tell us what you’re dreaming up. The whole campus is listening.</p><p className="account-note">Posting as <strong>{account.committeeName || account.name}</strong></p></section><section className="form-page-section wrap"><div className="form-side-note"><span className="side-doodle">✳</span><p>Potluck? Poetry night? Bring it on.</p></div><div className="form-panel"><h2>Tell us about it</h2><p className="form-lede">A few details and you’re on your way.</p><form onSubmit={submit} noValidate>
      <FormField label="Event name" name="name" value={values.name} onChange={change} error={errors.name} maxLength={100} placeholder="What are we calling it?" required />
      <FormField as="textarea" label="A little about it" name="description" value={values.description} onChange={change} error={errors.description} maxLength={1000} rows={4} hint="At least 10 characters. Give people a reason to come." required />
      <FormField label="Date and time" name="date" type="datetime-local" value={values.date} min={dateInput(new Date())} onChange={change} error={errors.date} required />
      <FormField label="Where’s it happening?" name="venue" value={values.venue} onChange={change} error={errors.venue} maxLength={120} placeholder="Building, room, or somewhere outside" required />
      <FormField as="select" label="Pick a category" name="category" value={values.category} onChange={change} error={errors.category} required><option value="">Choose one</option>{categories.map((category) => <option key={category}>{category}</option>)}</FormField>
      {message && <Feedback kind={kind}>{message}</Feedback>}<button className="button button-dark" disabled={busy}>{busy ? 'Putting it on the calendar…' : 'Add to the calendar'} <span aria-hidden="true">↗</span></button>
    </form></div></section></main>;
}

function ContactPage() {
  const [values, setValues] = useState({ name: '', email: '', message: '' }); const [errors, setErrors] = useState({}); const [feedback, setFeedback] = useState(''); const [busy, setBusy] = useState(false); const [kind, setKind] = useState('success');
  const change = (event) => { setValues({ ...values, [event.target.name]: event.target.value }); setErrors({ ...errors, [event.target.name]: '' }); setFeedback(''); };
  const submit = async (event) => {
    event.preventDefault(); const next = {};
    if (values.name.trim().length < 2 || values.name.trim().length > 80) next.name = 'Use 2–80 characters.';
    if (!emailOk(values.email) || values.email.length > 254) next.email = 'Enter a valid email address.';
    if (values.message.trim().length < 10 || values.message.trim().length > 2000) next.message = 'Use 10–2,000 characters.';
    setErrors(next); setFeedback(''); if (Object.keys(next).length) return;
    setBusy(true);
    try { const result = await apiRequest('/contacts', { method: 'POST', body: values }); setFeedback(result.message); setKind('success'); setValues({ name: '', email: '', message: '' }); }
    catch (issue) { setErrors(issue.fields || {}); setFeedback(issue.fields && Object.keys(issue.fields).length ? '' : issue.message); setKind('error'); }
    finally { setBusy(false); }
  };
  return <main className="page-main contact-main"><section className="page-intro wrap narrow-intro"><p className="eyebrow">We’re real people with real inboxes</p><h1>Drop us<br /><em>a note.</em></h1><p>Question, suggestion, or just want to say hi? We’re all ears.</p></section><section className="contact-section wrap"><div className="contact-aside"><span className="contact-stamp">HELLO<br /><i>there!</i></span><div><p className="eyebrow">A small note</p><p>We read every message. A human will get back to you as soon as campus life allows.</p></div></div><div className="form-panel contact-panel"><h2>Contact us</h2><form onSubmit={submit} noValidate>
    <FormField label="Your name" name="name" value={values.name} onChange={change} error={errors.name} maxLength={80} autoComplete="name" required />
    <FormField label="Email address" name="email" type="email" value={values.email} onChange={change} error={errors.email} maxLength={254} autoComplete="email" required />
    <FormField as="textarea" label="What’s on your mind?" name="message" value={values.message} onChange={change} error={errors.message} maxLength={2000} rows={5} hint="At least 10 characters, please." required />
    {feedback && <Feedback kind={kind}>{feedback}</Feedback>}<button className="button button-dark" disabled={busy}>{busy ? 'Sending your note…' : 'Send it our way'} <span aria-hidden="true">↗</span></button>
  </form></div></section></main>;
}

function AccessRequired({ message }) {
  return <main className="page-main"><section className="access-panel wrap"><span className="invite-mark">✳</span><p className="eyebrow">A note about this page</p><h1>Just for the committee.</h1><p>{message}</p><Link className="button button-dark" to="/login">Choose a login ↗</Link></section></main>;
}

function LoginPage({ onLogin }) {
  const [role, setRole] = useState('student');
  const [creating, setCreating] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', department: '', year: '', password: '' });
  const [errors, setErrors] = useState({}); const [feedback, setFeedback] = useState(''); const [kind, setKind] = useState('error'); const [busy, setBusy] = useState(false);
  const update = (event) => { setValues({ ...values, [event.target.name]: event.target.value }); setErrors({ ...errors, [event.target.name]: '' }); setFeedback(''); };
  const chooseRole = (nextRole) => { setRole(nextRole); setCreating(false); setErrors({}); setFeedback(''); };
  const submit = async (event) => {
    event.preventDefault(); const next = {};
    if (!emailOk(values.email) || values.email.length > 254) next.email = 'Enter a valid email address.';
    if (!values.password || values.password.length > 128 || (creating && values.password.length < 8)) next.password = creating ? 'Use a password with 8–128 characters.' : 'Enter your password.';
    if (creating && (values.name.trim().length < 2 || values.name.trim().length > 80)) next.name = 'Use 2–80 characters.';
    if (creating && (values.department.trim().length < 2 || values.department.trim().length > 80)) next.department = 'Use 2–80 characters.';
    if (creating && !['1', '2', '3', '4'].includes(values.year)) next.year = 'Choose your year of study.';
    setErrors(next); setFeedback(''); if (Object.keys(next).length) return; setBusy(true);
    try {
      const endpoint = creating ? '/auth/student/register' : '/auth/login';
      const body = creating ? { ...values, role: 'student' } : { email: values.email, password: values.password, role };
      const result = await apiRequest(endpoint, { method: 'POST', body });
      saveSession({ token: result.token, user: result.user }); onLogin(result.user); setKind('success'); setFeedback(result.message);
    } catch (issue) { setErrors(issue.fields || {}); setKind('error'); setFeedback(issue.fields && Object.keys(issue.fields).length ? '' : issue.message); }
    finally { setBusy(false); }
  };
  return <main className="page-main login-main"><section className="page-intro wrap narrow-intro"><p className="eyebrow">Your place on campus</p><h1>Come on<br /><em>in.</em></h1><p>Sign in to keep your campus plans together.</p></section><section className="login-section wrap"><div className="login-aside"><span className="login-stamp">CAMPUS<br /><i>together</i></span><p>One campus, plenty of ways to be part of it.</p></div><div className="form-panel login-panel"><h2>Choose your login</h2><div className="role-switch" role="group" aria-label="Account type"><button type="button" aria-pressed={role === 'student'} className={role === 'student' ? 'selected' : ''} onClick={() => chooseRole('student')}>Student</button><button type="button" aria-pressed={role === 'committee'} className={role === 'committee' ? 'selected' : ''} onClick={() => chooseRole('committee')}>Committee</button></div>
    {role === 'committee' && <p className="form-lede">Committee accounts are set up by the CampusConnect coordinator.</p>}
    <form onSubmit={submit} noValidate>
      {creating && <>
        <FormField label="Your name" name="name" value={values.name} onChange={update} error={errors.name} autoComplete="name" maxLength={80} required />
        <FormField label="Department" name="department" value={values.department} onChange={update} error={errors.department} maxLength={80} placeholder="e.g. Environmental Science" required />
        <FormField as="select" label="Year of study" name="year" value={values.year} onChange={update} error={errors.year} required><option value="">Choose your year</option>{[1, 2, 3, 4].map((year) => <option key={year} value={year}>{year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} year</option>)}</FormField>
      </>}
      <FormField label="Email address" name="email" type="email" value={values.email} onChange={update} error={errors.email} autoComplete="email" maxLength={254} required />
      <FormField label="Password" name="password" type="password" value={values.password} onChange={update} error={errors.password} autoComplete={creating ? 'new-password' : 'current-password'} minLength={creating ? 8 : undefined} maxLength={128} hint={creating ? 'Use at least 8 characters.' : undefined} required />
      {feedback && <Feedback kind={kind}>{feedback}</Feedback>}
      <button className="button button-dark" disabled={busy}>{busy ? 'One moment…' : creating ? 'Create student account' : `Sign in as ${role === 'student' ? 'a student' : 'committee'}`} <span aria-hidden="true">↗</span></button>
    </form>
    {role === 'student' && <p className="signup-toggle">{creating ? 'Already have an account?' : 'New to CampusConnect?'} <button type="button" onClick={() => { setCreating(!creating); setErrors({}); setFeedback(''); }}>{creating ? 'Sign in' : 'Create a student account'}</button></p>}
  </div></section></main>;
}

function DashboardPage({ account }) {
  const [data, setData] = useState({ events: [], registrations: [] });
  const [loading, setLoading] = useState(Boolean(account)); const [error, setError] = useState('');
  useEffect(() => {
    if (!account) return;
    let active = true;
    const endpoint = account.role === 'student' ? '/registrations/mine' : '/registrations/committee';
    Promise.all([apiRequest(endpoint), account.role === 'student' ? apiRequest('/events') : Promise.resolve({ events: [] })])
      .then(([activity, eventList]) => { if (active) setData({ events: account.role === 'committee' ? activity.events : eventList.events, registrations: activity.registrations }); })
      .catch((issue) => { if (active) setError(issue.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [account]);
  if (!account) return <AccessRequired message="Sign in to see your campus dashboard." />;
  const isStudent = account.role === 'student';
  const upcoming = data.events.filter((event) => new Date(event.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
  return <main className="page-main dashboard-main"><section className="dashboard-heading wrap"><p className="eyebrow">{isStudent ? 'Your student space' : account.committeeName || 'Committee space'}</p><h1>{isStudent ? <>Hello, <em>{account.name.split(' ')[0]}.</em></> : <>Welcome, <em>committee.</em></>}</h1><p>{isStudent ? 'Here are the events you’ve saved and what’s still ahead.' : 'Your committee events and the students joining you.'}</p></section>
    {loading ? <div className="wrap"><Feedback>Loading your campus space…</Feedback></div> : error ? <div className="wrap"><Feedback kind="error">{error}</Feedback></div> : <div className="wrap dashboard-content">{isStudent ? <>
      <section className="dashboard-section"><div className="section-heading compact"><div><p className="eyebrow">Your calendar</p><h2>Events you’ve registered for</h2></div><span className="list-count">{data.registrations.length} {data.registrations.length === 1 ? 'event' : 'events'}</span></div>
        {data.registrations.length ? <div className="dashboard-list">{data.registrations.map((registration) => <article className="dashboard-row" key={registration._id}><div className="event-date"><span>{new Date(registration.event.date).toLocaleDateString('en', { month: 'short' })}</span><strong>{new Date(registration.event.date).toLocaleDateString('en', { day: '2-digit' })}</strong></div><div><span className="eyebrow event-category">{registration.event.category}</span><h3>{registration.event.name}</h3><p>{registration.event.venue} · {new Date(registration.event.date).toLocaleDateString('en', { weekday: 'long', hour: 'numeric', minute: '2-digit' })}</p></div><span className="row-note">You’re on the list</span></article>)}</div> : <div className="empty-state compact-empty"><h3>No registrations yet.</h3><p>Find an event that sounds like you and save your place.</p><Link to="/events" className="button button-dark">Browse events ↗</Link></div>}
      </section><section className="dashboard-section"><div className="section-heading compact"><div><p className="eyebrow">Keep an eye out</p><h2>Upcoming events</h2></div><Link className="text-link" to="/events">All events ↗</Link></div>{upcoming.length ? <div className="dashboard-upcoming">{upcoming.slice(0, 4).map((event) => <article key={event._id}><span className="upcoming-date">{new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span><h3>{event.name}</h3><p>{event.venue} · {event.category}</p></article>)}</div> : <p className="muted">Nothing new on the calendar yet.</p>}</section>
    </> : <>
      <section className="dashboard-section"><div className="section-heading compact"><div><p className="eyebrow">Put something good together</p><h2>Your committee events</h2></div><Link to="/add-event" className="button button-dark">Add an event ↗</Link></div>{data.events.length ? <div className="dashboard-upcoming committee-events">{data.events.map((event) => <article key={event._id}><span className="upcoming-date">{new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span><h3>{event.name}</h3><p>{event.venue} · {event.category}</p></article>)}</div> : <div className="empty-state compact-empty"><h3>Your calendar is ready for its first event.</h3><p>Add an event and students can find it on campus.</p><Link to="/add-event" className="button button-dark">Add your first event ↗</Link></div>}</section>
      <section className="dashboard-section"><div className="section-heading compact"><div><p className="eyebrow">The people joining you</p><h2>Registered students</h2></div><span className="list-count">{data.registrations.length} {data.registrations.length === 1 ? 'student' : 'students'}</span></div>{data.registrations.length ? <div className="table-wrap"><table className="registration-table"><thead><tr><th>Student</th><th>Department</th><th>Year</th><th>Event</th></tr></thead><tbody>{data.registrations.map((registration) => <tr key={registration._id}><td><strong>{registration.name}</strong><span>{registration.email}</span></td><td>{registration.department}</td><td>{registration.year}{registration.year === 1 ? 'st' : registration.year === 2 ? 'nd' : registration.year === 3 ? 'rd' : 'th'}</td><td>{registration.event?.name || 'Event removed'}</td></tr>)}</tbody></table></div> : <div className="empty-state compact-empty"><h3>No one’s on the list yet.</h3><p>Once students register for your events, they’ll show up here.</p></div>}</section>
    </>}</div>}
  </main>;
}

function NotFound() { return <main className="page-main"><section className="empty-state wrap"><span>✳</span><h1>That page wandered off.</h1><Link to="/" className="button button-dark">Back home ↗</Link></section></main>; }

function PageContent({ account, onAccountChange }) {
  const { pathname, navigate } = useLocation();
  useEffect(() => { const handler = (event) => navigate(event.detail); window.addEventListener('campusconnect:navigate', handler); return () => window.removeEventListener('campusconnect:navigate', handler); }, [navigate]);
  const page = pathname === '/' ? <HomePage /> : pathname === '/events' ? <EventsPage account={account} /> : pathname === '/add-event' ? <AddEventPage account={account} /> : pathname === '/contact' ? <ContactPage /> : pathname === '/login' ? <LoginPage onLogin={(user) => { onAccountChange(user); navigate('/dashboard'); }} /> : pathname === '/dashboard' ? <DashboardPage account={account} /> : <NotFound />;
  return <><Header account={account} onLogout={() => { clearSession(); onAccountChange(null); navigate('/'); }} />{page}<Footer /></>;
}

export default function App() {
  const [account, setAccount] = useState(() => readSession()?.user || null);
  useEffect(() => {
    if (!readSession()?.token) return;
    let active = true;
    apiRequest('/auth/me').then((data) => { if (active) { setAccount(data.user); saveSession({ ...readSession(), user: data.user }); } })
      .catch(() => { if (active) { clearSession(); setAccount(null); } });
    return () => { active = false; };
  }, []);
  return <Router><PageContent account={account} onAccountChange={setAccount} /></Router>;
}

