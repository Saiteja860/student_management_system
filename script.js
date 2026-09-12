const API = "/api";
const main = document.getElementById("main");

let currentView = "dashboard";
let studentSearch = "";
let editingStudentId = null;
let attendanceDate = new Date().toISOString().slice(0, 10);
let marksSubject = null;

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentView = btn.dataset.view;
    editingStudentId = null;
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

async function render() {
  try {
    if (currentView === "dashboard") await renderDashboard();
    if (currentView === "students") await renderStudents();
    if (currentView === "attendance") await renderAttendance();
    if (currentView === "marks") await renderMarks();
    if (currentView === "fees") await renderFees();
  } catch (err) {
    main.innerHTML = `<div class="error-state">Couldn't reach the server: ${err.message}<br>Make sure "node server.js" is running.</div>`;
  }
}

/* ---------------- Dashboard ---------------- */
async function renderDashboard() {
  const students = await api("/students");
  const todaysAttendance = await api(`/attendance/${attendanceDate}`);
  const fees = await api("/fees");

  const presentToday = Object.values(todaysAttendance).filter((s) => s === "present").length;
  const totalDue = Object.values(fees).reduce((sum, f) => sum + (f.amount - f.paid), 0);

  main.innerHTML = `
    <h1 class="page-title">Dashboard</h1>
    <p class="page-sub">An overview of today's records.</p>
    <div class="stat-row">
      <div class="stat-card"><div class="stat-num">${students.length}</div><div class="stat-label">Enrolled students</div></div>
      <div class="stat-card"><div class="stat-num">${presentToday}/${students.length}</div><div class="stat-label">Present today</div></div>
      <div class="stat-card"><div class="stat-num">₹${totalDue.toLocaleString("en-IN")}</div><div class="stat-label">Fees outstanding</div></div>
    </div>
    <div class="panel">
      <h3>Recently added students</h3>
      ${studentTableRows(students.slice(-5).reverse(), false)}
    </div>
  `;
}

/* ---------------- Students ---------------- */
function studentTableRows(list, withActions = true) {
  if (list.length === 0) {
    return `<div class="empty-state">No students to show yet. Add one to get started.</div>`;
  }
  return `
    <table>
      <thead><tr><th>Roll No.</th><th>Name</th><th>Class</th><th>Contact</th>${withActions ? "<th></th>" : ""}</tr></thead>
      <tbody>
        ${list
          .map(
            (s) => `
          <tr>
            <td>${s.roll}</td>
            <td>${s.name}</td>
            <td>${s.cls}</td>
            <td>${s.contact}</td>
            ${
              withActions
                ? `<td>
                <button class="btn-ghost btn-small" onclick="startEditStudent(${s.id})">Edit</button>
                <button class="btn-danger" style="margin-left:10px" onclick="deleteStudent(${s.id})">Remove</button>
              </td>`
                : ""
            }
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

async function renderStudents() {
  const students = await api("/students");
  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.roll.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const editing = editingStudentId !== null ? students.find((s) => s.id === editingStudentId) : null;

  main.innerHTML = `
    <h1 class="page-title">Students</h1>
    <p class="page-sub">Add, search, and edit student records.</p>

    <div class="panel">
      <h3>${editing ? "Edit student" : "Add a new student"}</h3>
      <form id="student-form">
        <div class="field-row">
          <div class="field"><label>Full name</label><input required id="f-name" value="${editing ? editing.name : ""}"></div>
          <div class="field"><label>Roll number</label><input required id="f-roll" value="${editing ? editing.roll : ""}"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Class / Section</label><input required id="f-cls" value="${editing ? editing.cls : ""}"></div>
          <div class="field"><label>Contact number</label><input required id="f-contact" value="${editing ? editing.contact : ""}"></div>
        </div>
        <div class="field"><label>Email</label><input type="email" id="f-email" value="${editing ? editing.email : ""}"></div>
        <button type="submit" class="btn btn-primary">${editing ? "Save changes" : "Add student"}</button>
        ${editing ? `<button type="button" class="btn btn-ghost" style="margin-left:10px" onclick="cancelEditStudent()">Cancel</button>` : ""}
      </form>
    </div>

    <div class="panel">
      <h3>All students</h3>
      <div class="search-bar"><input id="search-input" placeholder="Search by name or roll number..." value="${studentSearch}"></div>
      ${studentTableRows(filtered)}
    </div>
  `;

  document.getElementById("student-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById("f-name").value.trim(),
      roll: document.getElementById("f-roll").value.trim(),
      cls: document.getElementById("f-cls").value.trim(),
      contact: document.getElementById("f-contact").value.trim(),
      email: document.getElementById("f-email").value.trim(),
    };
    if (editingStudentId !== null) {
      await api(`/students/${editingStudentId}`, { method: "PUT", body: JSON.stringify(data) });
      editingStudentId = null;
    } else {
      await api("/students", { method: "POST", body: JSON.stringify(data) });
    }
    render();
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    studentSearch = e.target.value;
    renderStudents();
  });
}

function startEditStudent(id) {
  editingStudentId = id;
  renderStudents();
}
function cancelEditStudent() {
  editingStudentId = null;
  renderStudents();
}
async function deleteStudent(id) {
  await api(`/students/${id}`, { method: "DELETE" });
  render();
}

/* ---------------- Attendance ---------------- */
async function renderAttendance() {
  const students = await api("/students");
  const dayRecord = await api(`/attendance/${attendanceDate}`);

  main.innerHTML = `
    <h1 class="page-title">Attendance</h1>
    <p class="page-sub">Mark attendance for a given date.</p>
    <div class="panel">
      <div class="field" style="max-width:220px;"><label>Date</label><input type="date" id="att-date" value="${attendanceDate}"></div>
      ${
        students.length === 0
          ? `<div class="empty-state">Add students first to take attendance.</div>`
          : `
      <table>
        <thead><tr><th>Roll No.</th><th>Name</th><th>Status</th></tr></thead>
        <tbody>
          ${students
            .map((s) => {
              const status = dayRecord[s.id];
              return `
              <tr>
                <td>${s.roll}</td>
                <td>${s.name}</td>
                <td>
                  <button class="btn btn-small ${status === "present" ? "btn-primary" : "btn-ghost"}" onclick="markAttendance(${s.id}, 'present')">Present</button>
                  <button class="btn btn-small ${status === "absent" ? "btn-primary" : "btn-ghost"}" style="margin-left:6px;" onclick="markAttendance(${s.id}, 'absent')">Absent</button>
                  ${status ? `<span class="badge badge-${status}" style="margin-left:10px;">${status}</span>` : ""}
                </td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
      }
    </div>
  `;

  document.getElementById("att-date").addEventListener("change", (e) => {
    attendanceDate = e.target.value;
    renderAttendance();
  });
}

async function markAttendance(studentId, status) {
  await api(`/attendance/${attendanceDate}`, { method: "POST", body: JSON.stringify({ studentId, status }) });
  renderAttendance();
}

/* ---------------- Marks ---------------- */
function gradeFor(score) {
  if (score >= 75) return { label: "A", cls: "grade-A" };
  if (score >= 50) return { label: "B", cls: "grade-B" };
  return { label: "C", cls: "grade-C" };
}

async function renderMarks() {
  const students = await api("/students");
  const { marks, subjects } = await api("/marks");
  if (!marksSubject) marksSubject = subjects[0];

  main.innerHTML = `
    <h1 class="page-title">Marks</h1>
    <p class="page-sub">Enter marks per subject and see standing at a glance.</p>
    <div class="panel">
      <div class="field" style="max-width:260px;">
        <label>Subject</label>
        <select id="subject-select">${subjects.map((sub) => `<option value="${sub}" ${sub === marksSubject ? "selected" : ""}>${sub}</option>`).join("")}</select>
      </div>
      ${
        students.length === 0
          ? `<div class="empty-state">Add students first to enter marks.</div>`
          : `
      <table>
        <thead><tr><th>Roll No.</th><th>Name</th><th>Marks (/100)</th><th>Overall average</th></tr></thead>
        <tbody>
          ${students
            .map((s) => {
              const studentMarks = marks[s.id] || {};
              const score = studentMarks[marksSubject] ?? "";
              const allScores = Object.values(studentMarks);
              const avg = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null;
              const g = avg !== null ? gradeFor(avg) : null;
              return `
              <tr>
                <td>${s.roll}</td>
                <td>${s.name}</td>
                <td><input type="number" min="0" max="100" style="width:80px" value="${score}" onchange="setMark(${s.id}, this.value)"></td>
                <td>${avg !== null ? `<span class="avg-mark ${g.cls}">${avg.toFixed(1)} (${g.label})</span>` : "—"}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
      }
    </div>
  `;

  document.getElementById("subject-select").addEventListener("change", (e) => {
    marksSubject = e.target.value;
    renderMarks();
  });
}

async function setMark(studentId, value) {
  await api("/marks", { method: "POST", body: JSON.stringify({ studentId, subject: marksSubject, score: value }) });
  renderMarks();
}

/* ---------------- Fees ---------------- */
async function renderFees() {
  const students = await api("/students");
  const fees = await api("/fees");

  main.innerHTML = `
    <h1 class="page-title">Fees</h1>
    <p class="page-sub">Track dues and payments per student.</p>
    <div class="panel">
      ${
        students.length === 0
          ? `<div class="empty-state">Add students first to track fees.</div>`
          : `
      <table>
        <thead><tr><th>Roll No.</th><th>Name</th><th>Amount</th><th>Paid</th><th>Due date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${students
            .map((s) => {
              const f = fees[s.id] || { amount: 0, paid: 0, due: "—" };
              const balance = f.amount - f.paid;
              const isPaid = balance <= 0 && f.amount > 0;
              return `
              <tr>
                <td>${s.roll}</td>
                <td>${s.name}</td>
                <td>₹${f.amount.toLocaleString("en-IN")}</td>
                <td>₹${f.paid.toLocaleString("en-IN")}</td>
                <td>${f.due}</td>
                <td><span class="badge ${isPaid ? "badge-paid" : "badge-due"}">${isPaid ? "Paid in full" : `₹${balance.toLocaleString("en-IN")} due`}</span></td>
                <td>${!isPaid ? `<button class="btn btn-small btn-primary" onclick="markFeePaid(${s.id})">Mark fully paid</button>` : ""}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
      }
    </div>
  `;
}

async function markFeePaid(studentId) {
  await api(`/fees/${studentId}/pay`, { method: "POST" });
  renderFees();
}

render();
