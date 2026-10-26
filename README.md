# CampusConnect

CampusConnect is a small college event management project built with MongoDB, Express, React, and Node.js. Students can browse events and register; organizers can add events; visitors can send a message. It is intentionally kept simple enough to follow in a practical or beginner project.

## What you need

- Node.js 20.19+ or 22.12+ (Vite 7 requirement) and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- A terminal in the `CampusConnect` project directory

## Install

Install the two app parts and the root development helper:

```bash
npm run install:all
npm install
```

Copy the example environment files and adjust them for your setup:

```bash
# macOS / Linux
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

`backend/.env` contains server-only configuration:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/campusconnect
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace-this-with-a-random-secret-at-least-32-characters-long
# Optional committee account created by the seed command
SEED_COMMITTEE_EMAIL=committee@example.edu
SEED_COMMITTEE_PASSWORD=choose-a-private-password
SEED_COMMITTEE_NAME=Student Events Committee
```

For Atlas, replace `MONGODB_URI` with the connection string from your Atlas database user and cluster. Set `JWT_SECRET` to a new random value with at least 32 characters. To provision a committee account, set its three `SEED_COMMITTEE_*` values before running the seed command. Committee accounts cannot be created through the public sign-up form. Keep all these values private; the `.env` file is ignored by Git. In Atlas, add your development machine's IP to the network access list and make sure the database user has read/write access.

`frontend/.env` configures the browser's API base URL:

```env
VITE_API_URL=http://localhost:5000/api
```

Set this to the deployed API base URL when building the production frontend. Vite embeds `VITE_*` values into the browser bundle, so never put credentials or secrets in frontend environment variables.

## Run locally

Start MongoDB Community Server (or use your configured Atlas database), then seed a few upcoming events:

```bash
npm run seed
```

The seed script adds the sample events without clearing existing event data. Then start the frontend and backend together:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs on port 5000. You can also run each process in its own terminal with `npm run dev --prefix backend` and `npm run dev --prefix frontend`.

## Pages and API

- `/` — editorial homepage with upcoming events
- `/events` — events loaded from MongoDB plus student registration
- `/add-event` — organizer form to create an event
- `/contact` — contact form
- `/login` — student sign-up/login or committee login
- `/dashboard` — student registrations and upcoming events, or committee events and registration list
- `GET /api/health` — API and database connection status
- `POST /api/auth/student/register`, `POST /api/auth/login`, `GET /api/auth/me` — student accounts and role-aware sign-in
- `GET /api/events` and `POST /api/events` — list or add events
- `POST /api/registrations`, `GET /api/registrations/mine`, `GET /api/registrations/committee` — register and view role-scoped registrations
- `POST /api/contacts` — save a contact message

Example requests:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/events
curl -X POST http://localhost:5000/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Patel","email":"asha@example.edu","department":"Literature","year":2,"password":"a-private-password"}'
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"committee@example.edu","password":"your-private-password","role":"committee"}'
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer REPLACE_WITH_COMMITTEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Open mic night","description":"An easygoing evening of songs, stories, and new faces.","date":"2030-05-18T18:30:00.000Z","venue":"Student Union lounge","category":"Arts & Culture"}'
curl -X POST http://localhost:5000/api/registrations \
  -H "Authorization: Bearer REPLACE_WITH_STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Patel","email":"asha@example.edu","department":"Literature","year":2,"eventId":"REPLACE_WITH_EVENT_ID"}'
curl http://localhost:5000/api/registrations/mine \
  -H "Authorization: Bearer REPLACE_WITH_STUDENT_TOKEN"
curl http://localhost:5000/api/registrations/committee \
  -H "Authorization: Bearer REPLACE_WITH_COMMITTEE_TOKEN"
curl -X POST http://localhost:5000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Patel","email":"asha@example.edu","message":"Could you tell me how to suggest a club event?"}'
```

Sign up for a student account from the Student tab on `/login`. For local committee access, configure the optional seed account above and rerun `npm run seed`. Sign in on the Committee tab. Student accounts can register and see their own registrations. Committee accounts can post events and see registration details for events they created. The API checks the account role on protected routes; hiding a button in React is not the security boundary.

Invalid payloads return HTTP 400 with an `errors` object keyed by field. A repeated email/event pair returns HTTP 409. The browser shows these errors beside the relevant fields. Event dates must be in the future.

## How the pieces fit

The React forms check input before sending it with `fetch` from `frontend/src/api.js`. Express routes in `backend/src/routes/` validate the request again, then use Mongoose models in `backend/src/models/` to save or load MongoDB documents. Passwords are salted and hashed with Node's built-in scrypt; signed seven-day tokens identify the account and role. The Events page reads `/api/events`; its event cards are always based on the API response, not an in-page mock list. The registration model links to an event by its MongoDB ID and has a unique index on email plus event, so concurrent duplicate attempts are rejected too. A committee-created event stores its committee account ID, which scopes its registration list.

## Useful files

```text
CampusConnect/
├── backend/
│   ├── src/models/          # Event, Registration, and Contact schemas
│   ├── src/models/Account.js # Student and committee accounts
│   ├── src/routes/          # Small REST endpoints
│   ├── src/middleware/      # Server validation and account-role checks
│   ├── src/server.js        # Express app, MongoDB connection, and health route
│   └── src/seed.js          # Sample upcoming events
├── frontend/
│   └── src/
│       ├── components/      # Shared layout, fields, feedback, event card
│       ├── App.jsx          # Four pages and form behavior
│       ├── api.js           # Configurable fetch client with signed-in sessions
│       ├── auth.js          # Browser session storage
│       └── styles.css       # Responsive site styling and color variables
├── .gitignore
└── README.md
```

## Build and API checks

Build the production frontend bundle:

```bash
npm run build
```

With the backend running, check the API using the curl examples above or visit `/api/health`. A `database: "connected"` result means the API process has an active MongoDB connection. To inspect saved records during development, use MongoDB Compass and connect to the same URI.

## Deploy with Vercel, Render, and MongoDB Atlas

The repository includes `render.yaml` for the Express API and `frontend/vercel.json` for client-side routes. Render's free web service can sleep after inactivity, so its first request after a quiet period may take a little longer.

1. **Create the database.** In MongoDB Atlas, create a project, a free shared cluster, and a database user with a strong password. Copy the Node.js connection string from Connect → Drivers and replace the password placeholder. Keep it private.
2. **Create the API on Render.** Choose New → Blueprint and select this GitHub repository. Render reads `render.yaml` and uses `backend/` as the service root. Enter the `MONGODB_URI`, your committee email and password, and a temporary `CLIENT_ORIGIN` in the secure setup form. Render generates `JWT_SECRET`.
3. **Restrict database access to Render.** In the Render service dashboard, open Connect → Outbound and copy the service's outbound IP ranges. Add those CIDR ranges to the Atlas project's Network Access list. Then redeploy the API if its initial database connection failed.
4. **Create the website on Vercel.** Import the repository as a separate Vercel project. Set Root Directory to `frontend`, use the Vite preset, set `VITE_API_URL` to `https://YOUR-RENDER-SERVICE.onrender.com/api`, build with `npm run build`, and publish `dist/`.
5. **Finish the connection.** Copy the Vercel origin into Render's `CLIENT_ORIGIN` variable and redeploy. Check `https://YOUR-RENDER-SERVICE.onrender.com/api/health` for `database: "connected"`. In Render's Shell, run `npm run seed` from the backend root to add sample events and provision the committee account. Store that committee password securely.

The app's secrets belong only in the hosting providers' environment settings. `.env` files are ignored by Git. Students can create accounts through the Student login on the site.

