# Organization Goal Tracker (Full-Stack MVP)

A full-stack, role-based organizational goal tracking web application built with **React, FastAPI, Python, SQLAlchemy ORM, and SQLite/MySQL**. The application enables employees to create and track goals with persistent storage, managers to review and approve them, and administrators to monitor organizational performance through real-time SQL-backed analytics.

---

## Overview

The Organization Goal Tracker models an organization's goal-setting and performance-tracking lifecycle with a high-performance Python REST API and an intuitive, responsive React frontend.

The application provides dedicated dashboards and workflows for:

* **Employees** — create, edit, submit, and delete goals; assign weightage; track quarterly achievements
* **Managers** — review and approve submitted goals, return goals for modification, record quarterly check-in feedback
* **Administrators** — monitor organization-wide performance, push shared departmental KPIs, unlock approved goals for adjustments, review audit trails, and export reports


---

## Features

### Employee Dashboard

* Create new goals
* Edit and delete draft goals
* Assign goal weightage
* Submit goals for manager approval
* Track goal status
* Log quarterly achievements
* View quarterly progress
* View manager check-ins
* Track approved and locked goals

### Manager Dashboard

* View employee goals
* Review submitted goals
* Approve goals
* Return goals for modification
* Monitor employee progress
* Record quarterly check-ins
* View goal and achievement information

### Admin Dashboard

* Monitor organization-wide goals
* View performance analytics
* Manage shared goals and KPIs
* Push goals to employees or departments
* Unlock approved goals when required
* Review audit activity
* View achievement trends
* Export achievement information as CSV

---

## Goal Lifecycle

The application models a goal through several stages:

```text
Draft
  ↓
Submitted
  ↓
Pending Manager Review
  ↓
Approved / Returned
  ↓
Locked
  ↓
Quarterly Achievement Tracking
  ↓
Manager Check-in
```

This workflow provides a simple model of how organizational goals can move from creation to review and performance tracking.

---

## Goal Progress Calculation

The application supports different types of goal measurement.

Examples include:

### Higher is Better

For goals where a higher value represents better performance:

```text
Achievement % = Actual / Target × 100
```

For example:

```text
Target = 100
Actual = 80

Achievement = 80%
```

### Lower is Better

For goals where a lower value represents better performance:

```text
Achievement % = Target / Actual × 100
```

The result is capped at 100%.

### Zero-Based Goals

For goals where the target is zero, such as reducing incidents:

```text
Actual = 0 → 100%
Actual > 0 → 0%
```

### Timeline Goals

Goals based on completion dates can be evaluated based on whether the target date was achieved.

---

## CRUD Operations

The application implements CRUD functionality for goals.

| Operation | Example                                   |
| --------- | ----------------------------------------- |
| Create    | Create a new goal                         |
| Read      | Display employee and organizational goals |
| Update    | Edit a draft goal                         |
| Delete    | Delete a draft goal                       |

The application uses JavaScript array operations such as `map()`, `filter()`, and `reduce()` to manipulate and process goal data.

---

## Technology Stack

### Frontend

* **React**
* **JavaScript (ES6+)**
* **JSX**
* **CSS / React inline styling**

### Development Tools

* **Vite**
* **ESLint**
* **Git**
* **GitHub**

### Deployment

* **Vercel**

---

## React Concepts Used

The project uses several core React concepts:

### Functional Components

The application is divided into reusable functional components such as:

* Cards
* Buttons
* Badges
* Modals
* Tabs
* Progress bars
* Alerts
* Employee dashboard
* Manager dashboard
* Admin dashboard

### React State

Application data and UI state are managed using React Hooks such as:

```javascript
const [goals, setGoals] = useState(INIT_GOALS);
```

State updates cause the relevant parts of the UI to re-render.

### Props

Data and callback functions are passed between components using props.

For example:

```javascript
function EmployeeDash({ cu, goals, setGoals, setAudit }) {
    // ...
}
```

### Conditional Rendering

Different UI elements are displayed depending on application state and user role.

```jsx
{condition && <Component />}
```

### List Rendering

Goal and user collections are rendered dynamically using JavaScript's `map()` method.

```jsx
goals.map(goal => (
    <Card key={goal.id}>
        {goal.title}
    </Card>
))
```

### Controlled Forms

Form fields are managed using React state and `onChange` handlers.

```jsx
<input
    value={email}
    onChange={e => setEmail(e.target.value)}
/>
```

---

## Application Architecture

The current version is a frontend-focused prototype.

```text
                    React Application
                           |
                        App.jsx
                           |
             ┌─────────────┼─────────────┐
             |             |             |
             ↓             ↓             ↓
       Employee Dash   Manager Dash   Admin Dash
             |             |             |
             └─────────────┼─────────────┘
                           |
                     React State
                           |
                 JavaScript Data Objects
```

Reusable UI components are shared across the different dashboards.

---

## Data Model

The application models several types of information:

```text
Users
Goals
Achievements
Manager Check-ins
Audit Logs
Escalations
Shared Goals
```

A goal contains information such as:

```javascript
{
    id,
    employeeId,
    thrustArea,
    title,
    description,
    uom,
    target,
    weightage,
    status,
    locked,
    achievements,
    checkins
}
```

---

## Data Storage

The current version is a **frontend prototype**.

Initial data is represented using JavaScript objects and arrays and is managed using React state.

There is currently no external backend database or REST API in the repository.

For a production implementation, the frontend could communicate with a backend through REST APIs:

```text
React Frontend
      ↓
REST API
      ↓
Backend Service
      ↓
PostgreSQL / MySQL
```

This would provide persistent storage, authentication, authorization, and server-side validation.

---

## Authentication and Roles

The current application uses a simplified demonstration login flow based on predefined users.

The application supports three roles:

```text
Employee
Manager
Admin
```

Each role receives a different dashboard and set of available actions.

Because this is a frontend prototype, role checks are currently performed on the client side.

For a production system, authentication and authorization should be enforced by the backend as well.

---

## Audit Trail

Important actions can be recorded in an audit log, including actions such as:

* Goal creation
* Goal editing
* Goal approval
* Achievement updates
* Manager check-ins
* Goal unlocking
* Shared goal creation

An audit record can contain information about the user, action, goal, timestamp, and additional details.

---

## CSV Export

The application supports exporting achievement information as CSV.

The browser creates the CSV data using the JavaScript `Blob` API and generates a downloadable object URL.

```text
Application Data
      ↓
CSV String
      ↓
Blob
      ↓
Object URL
      ↓
Browser Download
```

---

## Project Structure

```text
org-goal-tracker/
│
├── public/
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/samii83/org-goal-tracker.git
```

### 2. Navigate to the project

```bash
cd org-goal-tracker
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

The application will be available at the local development URL provided by Vite.

---

## Available Scripts

### Development

```bash
npm run dev
```

Starts the Vite development server.

### Production Build

```bash
npm run build
```

Creates an optimized production build.

### Preview Production Build

```bash
npm run preview
```

Previews the production build locally.

### Lint

```bash
npm run lint
```

Runs ESLint to identify potential JavaScript and React issues.

---

---

## Full-Stack Architecture (FastAPI + SQLAlchemy + SQLite / MySQL)

The application features a production-ready **FastAPI** backend supporting persistent storage, relational schema models, role-based security, live health diagnostics, and a SQL-backed real-time analytics dashboard:

* **Backend Framework:** FastAPI (Python 3.10+) with async lifespan support
* **ORM:** SQLAlchemy 2.0 with connection pooling
* **Database Support:**
  * **Default:** SQLite with persistent storage (`goaltrack.db` or `/app/data/goaltrack.db` in Docker)
  * **Optional MySQL:** Specify `DATABASE_URL` (e.g. `mysql+pymysql://user:password@host:3306/dbname`). Does not silently switch if MySQL connection fails.
* **Authentication:** Email/password authentication with `bcrypt` password hashing and signed HttpOnly cookie sessions
* **Role-Based Access Control (RBAC):** Employee, Manager, and Admin roles
* **Health & Diagnostics:** `/api/health` with live DB connectivity check and degraded-mode resilience
* **SQL-Backed Dashboard:** `/api/dashboard/stats` reporting total goals, completed goals, overdue goals, and active in-progress goals
* **CORS & Proxy:** Vite development proxy (`/api` -> `http://127.0.0.1:8000`) and FastAPI CORSMiddleware
* **Production Static Serving:** FastAPI automatically serves the built React frontend (`dist/`) directly when available, enabling single-container full-stack deployments.

### Database Schema Models

* `users` — Authentication credentials, role (`employee`, `manager`, `admin`), department, manager hierarchy
* `teams` — Departments and organizational business units
* `goals` — Individual and departmental KPIs, UoM, targets, weightage, approval status, lock state
* `check_ins` — Quarterly progress records, actual metrics, manager review comments
* `approvals` — Audit history of goal approvals, rejections, and manager adjustments
* `audit_events` — Immutable governance log of all critical changes and actions
* `escalations` — Automated compliance alerts for overdue check-ins and unsubmitted goal sheets

---

## Setup & Running Guide

### 1. Prerequisites

* **Node.js** (v18+ or v20+) and **npm**
* **Python** (3.10+ or 3.12+)
* *(Optional)* **Docker & Docker Compose**
* *(Optional)* **MySQL** (v8.0+ or MariaDB 10.5+ if using external MySQL)

### 2. Backend Setup (Local Development)

```bash
# 1. Create and activate a Python virtual environment
py -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux / macOS:
# source .venv/bin/activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Configure environment variables (optional; defaults to SQLite automatically)
cp .env.example .env
```

### 3. Running Development Servers

**Option A — Two-Process Development (with hot reloading):**

```bash
# Terminal 1: Start FastAPI backend (http://127.0.0.1:8000)
python backend/run.py

# Terminal 2: Start Vite frontend (http://localhost:5173, proxies /api -> :8000)
npm run dev
```

**Option B — Single-Process Full-Stack Production Run:**

```bash
# 1. Build the React frontend
npm run build

# 2. Run the FastAPI server (serves both React frontend & REST API on port 8000)
python backend/run.py
```
*Open `http://localhost:8000` in your browser.*

### 4. Running Backend Verification Tests

An automated test suite is provided to verify table creation, seeding, health checks, authentication, cookie sessions, goal CRUD operations, progress updates, and SQL dashboard statistics:

```bash
python backend/test_app.py
```

### 5. Running with Docker Compose (Single Container Full-Stack)

A multi-stage `Dockerfile` and `docker-compose.yml` are provided for containerized deployment with persistent SQLite storage:

```bash
# Build and start container with persistent data volume:
docker compose up -d --build
```
*Access the application at `http://localhost:8000`.*

---

## Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./goaltrack.db` | SQLAlchemy connection string. Defaults to persistent SQLite. Set to `mysql+pymysql://user:pass@host:3306/db` for MySQL. |
| `PORT` | `8000` | Port for the backend server |
| `HOST` | `0.0.0.0` | Host binding address |
| `ENVIRONMENT` | `development` | Environment mode (`development` or `production`) |
| `SECRET_KEY` | Dev string | 32+ byte cryptographic secret for HMAC session cookie signing |
| `SESSION_COOKIE_NAME` | `goaltrack_session` | Name of the authentication cookie |
| `SESSION_MAX_AGE_SECONDS` | `86400` | Session lifetime in seconds (24 hours) |
| `COOKIE_SECURE` | `false` | Set to `true` when serving behind HTTPS in production |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed frontend origins |



---

## Learning Objectives

This project demonstrates practical use of:

* React functional components
* React Hooks
* JSX
* Props and state
* Controlled forms
* Event handling
* Conditional rendering
* List rendering
* JavaScript array methods
* CRUD operations
* Role-based UI
* Data validation
* Business logic
* Reusable UI components
* Client-side data processing
* CSV generation
* Git and GitHub workflow

---

## License

This project is intended as a portfolio and learning project.
