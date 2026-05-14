import { useState, useEffect, createContext, useContext } from "react";

// ── Auth Context ──────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const API = "http://localhost:8080/api";

async function apiFetch(path, opts = {}, token) {
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
  if (!res.ok) {
    const txt = await res.text().catch(() => "Error");
    throw new Error(txt || res.statusText);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_ORDER = ["CREATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "DONE"];
const STATUS_META = {
  CREATED:     { label: "Created",     color: "#94a3b8", bg: "#1e293b" },
  ASSIGNED:    { label: "Assigned",    color: "#60a5fa", bg: "#1e3a5f" },
  IN_PROGRESS: { label: "In Progress", color: "#fb923c", bg: "#431407" },
  RESOLVED:    { label: "Resolved",    color: "#a78bfa", bg: "#2e1065" },
  DONE:        { label: "Done",        color: "#34d399", bg: "#064e3b" },
};

// ── Notification toast ────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map(t => (
            <div key={t.id} style={{
              background: t.type === "error" ? "#7f1d1d" : "#064e3b",
              border: `1px solid ${t.type === "error" ? "#ef4444" : "#34d399"}`,
              color: "#f1f5f9", padding: "12px 18px", borderRadius: 8,
              fontSize: 14, fontFamily: "'DM Mono', monospace", maxWidth: 320,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              animation: "slideIn 0.2s ease",
            }}>
              {t.msg}
            </div>
        ))}
      </div>
  );
}

// ── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, notify }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin(data);
    } catch (err) {
      notify(err.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div style={styles.authWrap}>
        <div style={styles.authCard}>
          <div style={styles.logoMark}>TM</div>
          <h1 style={styles.authTitle}>TaskFlow</h1>
          <p style={styles.authSub}>Collaborative Task Management</p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
                style={styles.input}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
            />
            <input
                style={styles.input}
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />
            <button style={{ ...styles.btn, ...styles.btnPrimary, marginTop: 6 }} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.CREATED;
  return (
      <span style={{
        background: m.bg, color: m.color, border: `1px solid ${m.color}40`,
        borderRadius: 4, padding: "2px 10px", fontSize: 11,
        fontFamily: "'DM Mono', monospace", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
      }}>{m.label}</span>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onStatusChange, onAssign, employees, isSupervisor, notify }) {
  const [assigning, setAssigning] = useState(false);
  const [selEmp, setSelEmp] = useState("");
  const [updating, setUpdating] = useState(false);
  const { token } = useAuth();

  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const nextStatus = STATUS_ORDER[currentIdx + 1];
  const canAdvance = nextStatus && !(isSupervisor && nextStatus === "ASSIGNED") &&
      !(isSupervisor && task.status === "RESOLVED" ? false : !isSupervisor && ["CREATED", "DONE"].includes(task.status));

  // Employees can: ASSIGNED→IN_PROGRESS, IN_PROGRESS→RESOLVED
  // Supervisors can: CREATED→ASSIGNED (via assign), RESOLVED→DONE
  const showAdvance = nextStatus && (
      (isSupervisor && task.status === "RESOLVED") ||
      (!isSupervisor && ["ASSIGNED", "IN_PROGRESS"].includes(task.status))
  );

  async function handleAdvance() {
    setUpdating(true);
    try {
      const updated = await apiFetch(`/tasks/${task.id}/status?status=${nextStatus}`, { method: "PUT" }, token);
      onStatusChange(updated);
      notify(`Task moved to ${STATUS_META[nextStatus].label}`);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setUpdating(false);
    }
  }

  async function handleAssign() {
    if (!selEmp) return;
    try {
      const updated = await apiFetch(`/tasks/${task.id}/assign/${selEmp}`, { method: "PUT" }, token);
      onAssign(updated);
      setAssigning(false);
      notify("Task assigned successfully");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={styles.cardTitle}>{task.title}</div>
            {task.description && <div style={styles.cardDesc}>{task.description}</div>}
          </div>
          <Badge status={task.status} />
        </div>

        <div style={styles.cardMeta}>
          {task.createdBy && <span>By <b style={{ color: "#94a3b8" }}>{task.createdBy.fullName || task.createdBy.email}</b></span>}
          {task.assignedTo && <span>→ <b style={{ color: "#60a5fa" }}>{task.assignedTo.fullName || task.assignedTo.email}</b></span>}
          {task.createdAt && <span style={{ marginLeft: "auto", opacity: 0.5 }}>{new Date(task.createdAt).toLocaleDateString()}</span>}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 12, height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2,
            width: `${((currentIdx + 1) / STATUS_ORDER.length) * 100}%`,
            background: STATUS_META[task.status]?.color || "#94a3b8",
            transition: "width 0.4s ease",
          }} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {showAdvance && (
              <button style={{ ...styles.btn, ...styles.btnAccent, fontSize: 12 }} onClick={handleAdvance} disabled={updating}>
                {updating ? "…" : `Mark as ${STATUS_META[nextStatus]?.label}`}
              </button>
          )}
          {isSupervisor && task.status === "CREATED" && (
              assigning ? (
                  <>
                    <select style={{ ...styles.input, padding: "5px 10px", fontSize: 13, flex: 1 }}
                            value={selEmp} onChange={e => setSelEmp(e.target.value)}>
                      <option value="">Pick employee…</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.fullName || e.email}</option>)}
                    </select>
                    <button style={{ ...styles.btn, ...styles.btnPrimary, fontSize: 12 }} onClick={handleAssign}>Assign</button>
                    <button style={{ ...styles.btn, fontSize: 12 }} onClick={() => setAssigning(false)}>Cancel</button>
                  </>
              ) : (
                  <button style={{ ...styles.btn, ...styles.btnPrimary, fontSize: 12 }} onClick={() => setAssigning(true)}>
                    Assign →
                  </button>
              )
          )}
        </div>
      </div>
  );
}

// ── Create Task Modal ─────────────────────────────────────────────────────────
function CreateTaskModal({ onClose, onCreate, notify }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const task = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ title, description: desc }),
      }, token);
      onCreate(task);
      notify("Task created!");
      onClose();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ color: "#f1f5f9", fontSize: 18, fontFamily: "'DM Mono', monospace" }}>New Task</h2>
            <button style={{ ...styles.btn, padding: "4px 10px" }} onClick={onClose}>✕</button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input style={styles.input} placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} required />
            <textarea style={{ ...styles.input, minHeight: 90, resize: "vertical" }}
                      placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" style={styles.btn} onClick={onClose}>Cancel</button>
              <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }} disabled={loading}>
                {loading ? "Creating…" : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

// ── Create Employee Modal ─────────────────────────────────────────────────────
function CreateEmployeeModal({ onClose, notify }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password, role: "EMPLOYEE" }),
      }, token);
      notify("Employee created!");
      onClose();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ color: "#f1f5f9", fontSize: 18, fontFamily: "'DM Mono', monospace" }}>New Employee</h2>
            <button style={{ ...styles.btn, padding: "4px 10px" }} onClick={onClose}>✕</button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input style={styles.input} placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
            <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" style={styles.btn} onClick={onClose}>Cancel</button>
              <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }} disabled={loading}>
                {loading ? "Creating…" : "Create Employee"}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

// ── Upload File Modal ─────────────────────────────────────────────────────────
function UploadModal({ onClose, notify }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      notify("File uploaded!");
      onClose();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ color: "#f1f5f9", fontSize: 18, fontFamily: "'DM Mono', monospace" }}>Upload File</h2>
            <button style={{ ...styles.btn, padding: "4px 10px" }} onClick={onClose}>✕</button>
          </div>
          <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              border: "2px dashed #334155", borderRadius: 8, padding: "30px 20px",
              textAlign: "center", color: "#64748b", cursor: "pointer",
              background: file ? "#0f2027" : "transparent",
            }}>
              <input type="file" style={{ display: "none" }} id="fileInput"
                     onChange={e => setFile(e.target.files[0])} />
              <label htmlFor="fileInput" style={{ cursor: "pointer" }}>
                {file ? <span style={{ color: "#60a5fa" }}>📄 {file.name}</span> : "Click to choose a file"}
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" style={styles.btn} onClick={onClose}>Cancel</button>
              <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }} disabled={loading || !file}>
                {loading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout, notify }) {
  const isSupervisor = user.role === "SUPERVISOR";
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [showEmployee, setShowEmployee] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadTasks();
    if (isSupervisor) loadEmployees();
  }, []);

  async function loadTasks() {
    setLoading(true);
    try {
      const data = await apiFetch("/tasks", {}, token);
      setTasks(data);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    try {
      // Backend may not have a /users endpoint; we derive employees from tasks
      const data = await apiFetch("/tasks", {}, token);
      const empMap = {};
      data.forEach(t => {
        if (t.assignedTo) empMap[t.assignedTo.id] = t.assignedTo;
        if (t.createdBy) {
          // collect non-supervisors
        }
      });
      setEmployees(Object.values(empMap));
    } catch {}
  }

  const myTasks = isSupervisor ? tasks : tasks.filter(t => t.assignedTo?.email === user.email);
  const filtered = filter === "ALL" ? myTasks : myTasks.filter(t => t.status === filter);

  // Stats
  const counts = STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: myTasks.filter(t => t.status === s).length }), {});
  const total = myTasks.length;

  function updateTask(updated) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  return (
      <div style={styles.dashWrap}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sideTop}>
            <div style={styles.logoMark}>TM</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{user.fullName || user.email}</div>
              <div style={{ color: "#60a5fa", fontSize: 11, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>
                {user.role}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ padding: "20px 0", borderBottom: "1px solid #1e293b" }}>
            <div style={styles.sideLabel}>Overview</div>
            {STATUS_ORDER.map(s => (
                <div key={s} style={styles.statRow}
                     onClick={() => setFilter(filter === s ? "ALL" : s)}>
              <span style={{ color: STATUS_META[s].color, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                {STATUS_META[s].label}
              </span>
                  <span style={{
                    background: filter === s ? STATUS_META[s].bg : "#1e293b",
                    color: filter === s ? STATUS_META[s].color : "#94a3b8",
                    borderRadius: 10, padding: "0 8px", fontSize: 12, fontFamily: "'DM Mono', monospace",
                  }}>{counts[s] || 0}</span>
                </div>
            ))}
            <div style={{ ...styles.statRow, marginTop: 8, borderTop: "1px solid #1e293b", paddingTop: 8 }}>
              <span style={{ color: "#f1f5f9", fontSize: 12 }}>Total</span>
              <span style={{ color: "#f1f5f9", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{total}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={styles.sideLabel}>Actions</div>
            {isSupervisor && (
                <>
                  <button style={styles.sideBtn} onClick={() => setShowCreate(true)}>+ New Task</button>
                  <button style={styles.sideBtn} onClick={() => setShowEmployee(true)}>+ New Employee</button>
                </>
            )}
            <button style={styles.sideBtn} onClick={() => setShowUpload(true)}>↑ Upload File</button>
            <button style={{ ...styles.sideBtn, color: "#f87171", marginTop: "auto" }} onClick={onLogout}>Sign Out</button>
          </div>
        </aside>

        {/* Main */}
        <main style={styles.main}>
          <div style={styles.mainHeader}>
            <div>
              <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>
                {isSupervisor ? "All Tasks" : "My Tasks"}
              </h1>
              {filter !== "ALL" && (
                  <div style={{ color: STATUS_META[filter]?.color, fontSize: 12, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                    Filtered: {STATUS_META[filter]?.label} — <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setFilter("ALL")}>clear</span>
                  </div>
              )}
            </div>
            <button style={{ ...styles.btn, fontSize: 13, opacity: 0.6 }} onClick={loadTasks}>↺ Refresh</button>
          </div>

          {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#475569", fontFamily: "'DM Mono', monospace" }}>Loading tasks…</div>
          ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div style={{ fontFamily: "'DM Mono', monospace" }}>No tasks {filter !== "ALL" ? `with status ${STATUS_META[filter]?.label}` : "yet"}</div>
                {isSupervisor && <button style={{ ...styles.btn, ...styles.btnPrimary, marginTop: 16 }} onClick={() => setShowCreate(true)}>Create first task</button>}
              </div>
          ) : (
              <div style={styles.grid}>
                {filtered.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={updateTask}
                        onAssign={updated => { updateTask(updated); loadEmployees(); }}
                        employees={employees}
                        isSupervisor={isSupervisor}
                        notify={notify}
                    />
                ))}
              </div>
          )}
        </main>

        {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} onCreate={t => setTasks(p => [t, ...p])} notify={notify} />}
        {showEmployee && <CreateEmployeeModal onClose={() => setShowEmployee(false)} notify={notify} />}
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} notify={notify} />}
      </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tm_auth")); } catch { return null; }
  });
  const [toasts, setToasts] = useState([]);

  function notify(msg, type = "success") {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }

  function handleLogin(data) {
    // data: { token, role, email, ... }
    localStorage.setItem("tm_auth", JSON.stringify(data));
    setAuth(data);
  }

  function handleLogout() {
    localStorage.removeItem("tm_auth");
    setAuth(null);
  }

  return (
      <AuthContext.Provider value={{ token: auth?.token }}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1e; font-family: 'Sora', sans-serif; }
        textarea { font-family: inherit; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
      `}</style>
        <Toast toasts={toasts} />
        {!auth ? (
            <LoginPage onLogin={handleLogin} notify={notify} />
        ) : (
            <Dashboard user={auth} onLogout={handleLogout} notify={notify} />
        )}
      </AuthContext.Provider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  authWrap: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "radial-gradient(ellipse at 50% 0%, #0f2027 0%, #0a0f1e 70%)",
  },
  authCard: {
    background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16,
    padding: "48px 40px", width: 360, boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
    textAlign: "center",
  },
  logoMark: {
    width: 52, height: 52, background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 800, fontSize: 18, fontFamily: "'DM Mono', monospace",
    margin: "0 auto 16px",
  },
  authTitle: {
    color: "#f1f5f9", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em",
    fontFamily: "'Sora', sans-serif", marginBottom: 6,
  },
  authSub: { color: "#475569", fontSize: 14, marginBottom: 28, fontFamily: "'DM Mono', monospace" },
  input: {
    background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 8,
    color: "#f1f5f9", padding: "10px 14px", fontSize: 14, width: "100%",
    outline: "none", transition: "border 0.2s",
    fontFamily: "'Sora', sans-serif",
  },
  btn: {
    background: "#1e293b", border: "1px solid #334155", borderRadius: 7,
    color: "#94a3b8", padding: "8px 16px", fontSize: 14, cursor: "pointer",
    fontFamily: "'DM Mono', monospace", transition: "all 0.15s",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none",
    color: "#fff", fontWeight: 600,
  },
  btnAccent: {
    background: "#064e3b", border: "1px solid #34d399", color: "#34d399",
  },
  dashWrap: { display: "flex", minHeight: "100vh", background: "#0a0f1e" },
  sidebar: {
    width: 240, background: "#0f172a", borderRight: "1px solid #1e293b",
    display: "flex", flexDirection: "column", padding: "24px 16px", flexShrink: 0,
    position: "sticky", top: 0, height: "100vh", overflowY: "auto",
  },
  sideTop: { paddingBottom: 20, borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 12 },
  sideLabel: { color: "#334155", fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, marginTop: 4 },
  statRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "6px 8px", borderRadius: 6, cursor: "pointer",
    transition: "background 0.15s", marginBottom: 2,
  },
  sideBtn: {
    background: "transparent", border: "1px solid #1e293b", borderRadius: 7,
    color: "#64748b", padding: "8px 12px", fontSize: 13, cursor: "pointer",
    fontFamily: "'DM Mono', monospace", textAlign: "left", width: "100%",
    transition: "all 0.15s",
  },
  main: { flex: 1, padding: "32px 32px", overflowY: "auto" },
  mainHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 28,
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16,
  },
  card: {
    background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12,
    padding: "18px 18px", transition: "border-color 0.2s, transform 0.15s",
  },
  cardTitle: { color: "#f1f5f9", fontWeight: 700, fontSize: 15, marginBottom: 4 },
  cardDesc: { color: "#64748b", fontSize: 13, lineHeight: 1.5 },
  cardMeta: {
    display: "flex", gap: 10, flexWrap: "wrap", color: "#475569",
    fontSize: 12, fontFamily: "'DM Mono', monospace", marginTop: 10,
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    padding: 20,
  },
  modal: {
    background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14,
    padding: "28px 28px", width: "100%", maxWidth: 440,
    boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
  },
};
