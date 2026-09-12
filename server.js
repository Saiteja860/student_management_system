/**
 * Student Management System — backend
 * Node.js + Express, with a JSON file acting as the database (data.json).
 * Swap `readDB`/`writeDB` for a real database (SQLite/MySQL/MongoDB) later
 * without touching the route logic much — that's the whole point of
 * keeping data access in one place.
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- tiny "database" helpers ----------
function readDB() {
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(raw);
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ---------- STUDENTS ----------
app.get("/api/students", (req, res) => {
  const db = readDB();
  res.json(db.students);
});

app.post("/api/students", (req, res) => {
  const db = readDB();
  const { name, roll, cls, contact, email } = req.body;
  if (!name || !roll || !cls || !contact) {
    return res.status(400).json({ error: "name, roll, cls, and contact are required" });
  }
  const student = { id: db.nextStudentId++, name, roll, cls, contact, email: email || "" };
  db.students.push(student);
  writeDB(db);
  res.status(201).json(student);
});

app.put("/api/students/:id", (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);
  const student = db.students.find((s) => s.id === id);
  if (!student) return res.status(404).json({ error: "Student not found" });
  Object.assign(student, req.body);
  writeDB(db);
  res.json(student);
});

app.delete("/api/students/:id", (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);
  db.students = db.students.filter((s) => s.id !== id);
  delete db.marks[id];
  delete db.fees[id];
  Object.values(db.attendance).forEach((day) => delete day[id]);
  writeDB(db);
  res.status(204).end();
});

// ---------- ATTENDANCE ----------
// GET /api/attendance/2026-09-12
app.get("/api/attendance/:date", (req, res) => {
  const db = readDB();
  res.json(db.attendance[req.params.date] || {});
});

// POST /api/attendance/2026-09-12  { studentId, status }
app.post("/api/attendance/:date", (req, res) => {
  const db = readDB();
  const { date } = req.params;
  const { studentId, status } = req.body;
  if (!["present", "absent"].includes(status)) {
    return res.status(400).json({ error: "status must be 'present' or 'absent'" });
  }
  if (!db.attendance[date]) db.attendance[date] = {};
  db.attendance[date][studentId] = status;
  writeDB(db);
  res.json(db.attendance[date]);
});

// ---------- MARKS ----------
app.get("/api/marks", (req, res) => {
  const db = readDB();
  res.json({ marks: db.marks, subjects: db.subjects });
});

// POST /api/marks  { studentId, subject, score }
app.post("/api/marks", (req, res) => {
  const db = readDB();
  const { studentId, subject, score } = req.body;
  if (!db.marks[studentId]) db.marks[studentId] = {};
  if (score === null || score === "" || isNaN(score)) {
    delete db.marks[studentId][subject];
  } else {
    db.marks[studentId][subject] = Math.max(0, Math.min(100, Number(score)));
  }
  writeDB(db);
  res.json(db.marks[studentId]);
});

// ---------- FEES ----------
app.get("/api/fees", (req, res) => {
  const db = readDB();
  res.json(db.fees);
});

// POST /api/fees/:studentId/pay  -> marks fully paid
app.post("/api/fees/:studentId/pay", (req, res) => {
  const db = readDB();
  const id = req.params.studentId;
  if (!db.fees[id]) db.fees[id] = { amount: 45000, paid: 0, due: "—" };
  db.fees[id].paid = db.fees[id].amount;
  writeDB(db);
  res.json(db.fees[id]);
});

app.listen(PORT, () => {
  console.log(`Student Management System running at http://localhost:${PORT}`);
});
