# Student Management System (Full Stack)

A full-stack Student Management System: Node.js + Express backend with a REST API,
and a vanilla HTML/CSS/JS frontend that talks to it over `fetch`.

## Stack
- **Backend:** Node.js, Express
- **Storage:** `data.json` (a JSON file acting as the database — easy to swap for
  SQLite/MySQL/MongoDB later since all reads/writes go through `readDB()`/`writeDB()`
  in `server.js`)
- **Frontend:** Plain HTML/CSS/JS served from the `public/` folder, no framework or build step

## Project structure
```
sms-backend/
├── server.js          Express server + REST API routes
├── data.json           Data store (students, attendance, marks, fees)
├── package.json
└── public/
    ├── index.html       App shell
    ├── style.css        Styling
    └── script.js        Frontend logic (calls the API)
```

## Setup

1. Make sure [Node.js](https://nodejs.org) is installed (v16+).
2. In this folder, install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open **http://localhost:3000** in your browser.

## API endpoints

| Method | Endpoint                        | Description                     |
|--------|----------------------------------|----------------------------------|
| GET    | `/api/students`                 | List all students               |
| POST   | `/api/students`                 | Add a student                   |
| PUT    | `/api/students/:id`              | Update a student                |
| DELETE | `/api/students/:id`              | Remove a student                |
| GET    | `/api/attendance/:date`          | Get attendance for a date       |
| POST   | `/api/attendance/:date`          | Mark attendance (`studentId`, `status`) |
| GET    | `/api/marks`                     | Get all marks + subject list    |
| POST   | `/api/marks`                     | Set a mark (`studentId`, `subject`, `score`) |
| GET    | `/api/fees`                      | Get fee records                 |
| POST   | `/api/fees/:studentId/pay`       | Mark a student's fees fully paid |

## Notes for extending this as a college project
- Swap `data.json` for a real database (SQLite is the easiest first step — same
  file-based simplicity, real query power) without changing the frontend at all.
- Add authentication (e.g. `express-session` or JWT) to separate Admin/Teacher/Student roles.
- Add input validation (e.g. `express-validator`) on the API routes.
- Add a `.gitignore` with `node_modules/` before pushing to GitHub.
