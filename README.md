# LRC Leagues

A web app for running individual roundnet leagues. Players sign up individually — no need to form a team in advance. Just find other players in the league, play matches, and enter the scores.

## How it works

- **Global admin** — creates leagues and sets a per-league admin password. There is one global admin for the whole app.
- **League admin** — each league has its own administrator who sets up the league (divisions, scoring rules, end date), manages players, and assigns players to divisions.
- **Anyone** — can view standings, submit match scores, and edit or delete matches. No login required.

Leagues have divisions (e.g. Division 1, Division 2). Division 1 is the top division. Players can play matches with and against anyone in the league, regardless of division. Points are awarded based on the result and the division ranks of all four players involved — beating stronger opponents earns more points.

---

## Prerequisites

You'll need the following installed on your computer:

- **Python 3.12+** — [python.org](https://www.python.org/downloads/)
- **uv** (Python package manager) — install with:
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
- **Node.js 20+** — [nodejs.org](https://nodejs.org/)
- **PostgreSQL** — [postgresql.org](https://www.postgresql.org/download/) or via Homebrew on Mac:
  ```bash
  brew install postgresql@16
  brew services start postgresql@16
  ```

---

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd League
```

### 2. Set up the database

```bash
createdb roundnet_league
```

### 3. Set up the backend

```bash
cd backend
uv sync
```

You need to set two environment variables. The easiest way is to export them in your terminal:

```bash
export DATABASE_URL=postgresql://localhost/roundnet_league
export ADMIN_PASSWORD_HASH=$(uv run python -c "
from passlib.context import CryptContext
ctx = CryptContext(schemes=['argon2'])
print(ctx.hash('your-password-here'))
")
```

Replace `your-password-here` with whatever you want the global admin password to be.

### 4. Set up the frontend

```bash
cd ../frontend
npm install
```

---

## Running the app

You need two terminal windows — one for the backend and one for the frontend.

**Terminal 1 — Backend:**
```bash
cd backend
uv run python -m fastapi dev src/backend/main.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Creating your first league

1. Go to [http://localhost:5173/admin](http://localhost:5173/admin) and log in with your global admin password.
2. Create a league — give it a name and set a league admin password (this is what the league administrator will use).
3. Share the league admin password with whoever is running that league.
4. The league admin goes to the league page, clicks **League Admin**, and logs in with the league admin password.
5. They complete the setup — number of divisions, scoring rules, end date — and click **Publish League**.
6. They add players and assign them to divisions.
7. Players can now submit match scores from the league page.

Deployment (Railway)
The app is deployed on Railway using three services: a Python backend, a static frontend, and a PostgreSQL database.
1. Create a Railway account
Go to railway.app and sign in with GitHub.
2. Create a new project
Click New Project → Deploy from GitHub repo → select your repository.
3. Add a PostgreSQL database
In your project dashboard, click New → Database → PostgreSQL. Railway will provision a free database and make its connection string available as a variable.
4. Configure the backend service
In the backend service settings:

Set Root Directory to backend

Add these environment variables:
VariableValueADMIN_PASSWORD_HASHOutput of the hash command belowDATABASE_URLSet to ${{Postgres.DATABASE_URL}} (Railway fills this in automatically)FRONTEND_URLYour frontend Railway URL, e.g. https://your-frontend.up.railway.app
To generate ADMIN_PASSWORD_HASH, run this locally and copy the output:
bashcd backend
uv run python -c "
from passlib.context import CryptContext
ctx = CryptContext(schemes=['argon2'])
print(ctx.hash('your-password-here'))
"
Paste the output directly into Railway's variable UI (not the raw editor) to avoid issues with special characters.
5. Configure the frontend service
In the frontend service settings:

Set Root Directory to frontend

Add this environment variable:
VariableValueVITE_API_URLYour backend Railway URL, e.g. https://your-backend.up.railway.app
Note: VITE_ variables are baked in at build time, so after setting this variable you need to trigger a redeploy of the frontend.
6. Deploy
Railway will automatically deploy both services when you push to your GitHub repository. The backend starts up and creates all database tables automatically on first run.
