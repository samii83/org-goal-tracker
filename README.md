# Organization Goal Tracker

A role-based organizational goal tracking web application built with **React, JavaScript, and Vite**. The application helps employees create and track goals, managers review and approve them, and administrators monitor organizational performance and progress.

**Live Demo:** https://org-goal-tracker.vercel.app/

---

## Overview

The Organization Goal Tracker is designed to model an organization's goal-setting and performance-tracking workflow.

The application provides different dashboards and workflows for:

* **Employees** — create, manage, submit, and track goals
* **Managers** — review, approve, return, and monitor employee goals
* **Administrators** — monitor organizational performance, manage shared goals, and view analytics

The project is implemented as a frontend prototype using React state and JavaScript data structures.

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

## Future Improvements

The current application is designed as a frontend prototype. Potential improvements include:

* Add a backend REST API
* Add persistent database storage
* Implement real authentication
* Add JWT or session-based authentication
* Implement backend role-based authorization
* Add server-side validation
* Add automated unit and integration tests
* Add API error handling
* Add loading and empty states
* Add pagination for large datasets
* Add more detailed analytics
* Add notification functionality
* Improve accessibility
* Add TypeScript
* Improve responsive design
* Add CI/CD checks using GitHub Actions

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
