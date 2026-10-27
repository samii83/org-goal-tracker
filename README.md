# Employee Goal Management System

A React and ASP.NET Core application for creating employee goals, submitting them for manager review, tracking quarterly progress, and reviewing organization-wide goal activity. ASP.NET Core REST APIs persist application data in SQLite with Entity Framework Core.

## Features

- Employees create, edit, delete, submit, and track goals.
- Managers review goals, approve or return them, and add quarterly check-in comments.
- Administrators review audit events and escalations, push department goals, and unlock goals.
- Server-side validation enforces supported goal types, target formats, a maximum of eight active goals, 10–100% goal weightage, 100% total weightage on submission, and valid progress updates.
- SQLite persistence stores users, teams, goals, quarterly check-ins, approvals, audit events, and escalations.
- The API returns structured HTTP errors; the React client displays API failures instead of reporting unsaved changes as successful.

## Requirements

- .NET 10 SDK
- Node.js 22 or newer and npm
- Docker and Docker Compose (optional)

## Run locally

1. Start the API from the repository root:

   ```powershell
   dotnet run --project backend/GoalTracker.Api/GoalTracker.Api.csproj --urls http://localhost:5000
   ```

   The API creates `backend/GoalTracker.Api/data/goaltrack.db` on first run. Set `DATABASE_PATH` to choose another SQLite file.

2. In a second terminal, install frontend dependencies and start Vite:

   ```powershell
   npm ci
   npm run dev
   ```

3. Open the Vite URL shown in the terminal. The development server proxies `/api` requests to `http://127.0.0.1:5000`.

The database is seeded with demo users and goals on first startup. Select a demo account email on the sign-in page. Demo accounts do not require a password; if a password is supplied, use `password123`. This simplified sign-in is for local demonstration only and is not production authentication.

## Run with Docker

```powershell
docker compose up --build
```

Open `http://localhost:8000`. SQLite data is persisted under `./data/goaltrack.db`.

## API

The REST API is rooted at `/api`. Goal and progress endpoints include:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/goals?employee_id={id}` | List goals, optionally filtered by employee |
| POST | `/api/goals?employee_id={id}` | Create a draft goal |
| PUT | `/api/goals/{id}` | Update an unlocked goal or manager-editable fields |
| DELETE | `/api/goals/{id}` | Delete an unlocked goal |
| POST | `/api/goals/submit?employee_id={id}` | Submit drafts after validating total weightage |
| POST | `/api/goals/{id}/achievement` | Record quarterly achievement |
| POST | `/api/goals/{id}/checkin` | Add manager check-in feedback |
| POST | `/api/goals/{id}/approve` | Approve and lock a goal |
| POST | `/api/goals/{id}/reject` | Return a goal for rework |
| GET | `/api/health` | Check API and database connectivity |

Other routes support demo sign-in, user/team lookup, dashboard statistics, shared goals, audit events, and escalations. Swagger-style API documentation is not enabled; use the route table and examples below.

### Example: create a goal

```powershell
$goal = @{
  thrustArea = "Innovation"
  title = "Automate monthly reporting"
  description = "Reduce manual reporting effort"
  uom = "Numeric (Higher is Better)"
  target = 12
  weightage = 10
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5000/api/goals?employee_id=1" `
  -ContentType "application/json" -Body $goal
```

Valid `uom` values are `Numeric (Higher is Better)`, `Numeric (Lower is Better)`, `Timeline`, and `Zero-based`. Timeline targets and achievements use `YYYY-MM-DD`; numeric targets must be positive, except zero-based goals whose target must be `0`.

### Example: log progress

```powershell
$progress = @{
  quarter = "Q1 (July)"
  actual = 8
  status = "On Track"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5000/api/goals/1/achievement" `
  -ContentType "application/json" -Body $progress
```

Invalid requests return HTTP 400 with a Problem Details payload (including field-specific validation errors); missing records return HTTP 404.

## Verify

Run the frontend checks:

```powershell
npm run lint
npm run build
```

Build the API:

```powershell
dotnet build backend/GoalTracker.Api/GoalTracker.Api.csproj
```

With the API running, exercise health, sign-in, goal CRUD, progress, manager approval/check-in, admin unlock, and invalid-input validation:

```powershell
.\backend\smoke-test.ps1
```
