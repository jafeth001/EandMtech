import { useState } from 'react';
import { STATUS_ORDER, STATUS_META } from './task';

// Notification toast 
export function Toast({ toasts }) {
  return (
    <div style={{ 
      position: "fixed", 
      top: 20, 
      right: 20, 
      zIndex: 9999, 
      display: "flex", 
      flexDirection: "column", 
      gap: 10 
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "error" ? "#7f1d1d" : "#064e3b",
          border: `1px solid ${t.type === "error" ? "#ef4444" : "#34d399"}`,
          color: "#f1f5f9", 
          padding: "12px 18px", 
          borderRadius: 8,
          fontSize: 14, 
          fontFamily: "'DM Mono', monospace", 
          maxWidth: 320,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          animation: "slideIn 0.2s ease",
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// Login Page 
export function LoginPage({ onLogin, notify }) {
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
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh"
    }}>
      <div style={{ 
        background: "#1e293b", 
        padding: "2rem", 
        borderRadius: "8px", 
        width: "100%", 
        maxWidth: "400px"
      }}>
        <div style={{ 
          fontSize: "2rem", 
          fontWeight: "bold", 
          textAlign: "center", 
          marginBottom: "1rem",
          color: "#34d399"
        }}>TM</div>
        <h1 style={{ 
          textAlign: "center", 
          marginBottom: "1rem",
          color: "#f1f5f9"
        }}>TaskFlow</h1>
        <p style={{ 
          textAlign: "center", 
          marginBottom: "1.5rem",
          color: "#94a3b8"
        }}>Collaborative Task Management</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input
            style={{ 
              padding: "0.75rem", 
              borderRadius: "4px", 
              border: "1px solid #334155", 
              backgroundColor: "#0f172a", 
              color: "#f1f5f9"
            }}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={{ 
              padding: "0.75rem", 
              borderRadius: "4px", 
              border: "1px solid #334155", 
              backgroundColor: "#0f172a", 
              color: "#f1f5f9"
            }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button 
            style={{ 
              padding: "0.75rem", 
              borderRadius: "4px", 
              border: "none", 
              backgroundColor: "#34d399", 
              color: "white", 
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background-color 0.2s ease"
            }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Status Badge 
export function Badge({ status }) {
  const { label, color, bg } = STATUS_META[status] || STATUS_META.CREATED;
  return (
    <span style={{
      background: bg, 
      color: color, 
      border: `1px solid ${color}40`,
      borderRadius: 4, 
      padding: "2px 10px", 
      fontSize: 11,
      fontFamily: "'DM Mono', monospace", 
      fontWeight: 600, 
      letterSpacing: "0.05em", 
      textTransform: "uppercase",
    }}>{label}</span>
  );
}

// Task Card 
export function TaskCard({ task, onStatusChange, onAssign, employees, isSupervisor, notify }) {
  const [assigning, setAssigning] = useState(false);
  const [selEmp, setSelEmp] = useState("");
  const [updating, setUpdating] = useState(false);
  const { token } = useAuth();

  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const nextStatus = STATUS_ORDER[currentIdx + 1];
  const canAdvance = nextStatus && !(isSupervisor && nextStatus === "ASSIGNED") &&
    !(isSupervisor && task.status === "RESOLVED" ? false : !isSupervisor && ["CREATED", "DONE"].includes(task.status));

  // Employees can: ASSIGNED -> IN_PROGRESS, IN_PROGRESS -> RESOLVED
  // Supervisors can: CREATED -> ASSIGNED (via assign), RESOLVED -> DONE
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
    <div style={{ 
      background: "#1e293b", 
      padding: "1rem", 
      borderRadius: "8px", 
      marginBottom: "1rem"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{task.title}</div>
          {task.description && <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>{task.description}</div>}
        </div>
        <Badge status={task.status} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        {task.createdBy && <span>By <b style={{ color: "#94a3b8" }}>{task.createdBy.fullName || task.createdBy.email}</b></span>}
        {task.assignedTo && <span><b style={{ color: "#60a5fa" }}>{task.assignedTo.fullName || task.assignedTo.email}</b></span>}
        {task.createdAt && <span style={{ marginLeft: "auto", opacity: 0.5 }}>{new Date(task.createdAt).toLocaleDateString()}</span>}
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: "12px", height: "3px", background: "#1e293b", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height: "100%", 
          borderRadius: "2px",
          width: `${((currentIdx + 1) / STATUS_ORDER.length) * 100}%`,
          background: STATUS_META[task.status]?.color || "#94a3b8",
          transition: "width 0.4s ease",
        }} />
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        {showAdvance && (
          <button 
            style={{ 
              padding: "0.4rem 0.8rem", 
              borderRadius: "4px", 
              border: "none", 
              backgroundColor: "#a78bfa", 
              color: "white",
              fontSize: "0.8rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background-color 0.2s ease"
            }}
            onClick={handleAdvance} 
            disabled={updating}
          >
            {updating ? "…" : `Mark as ${STATUS_META[nextStatus]?.label}`}
          </button>
        )}
        {isSupervisor && task.status === "CREATED" && (
          assigning ? (
            <>
              <select 
                style={{ 
                  padding: "0.3rem 0.6rem", 
                  borderRadius: "4px", 
                  border: "1px solid #334155", 
                  backgroundColor: "#0f172a", 
                  color: "#f1f5f9",
                  fontSize: "0.8rem",
                  flex: 1
                }}
                value={selEmp} 
                onChange={e => setSelEmp(e.target.value)}
              >
                <option value="">Pick employee…</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.fullName || e.email}</option>
                ))}
              </select>
              <button 
                style={{ 
                  padding: "0.4rem 0.8rem", 
                  borderRadius: "4px", 
                  border: "none", 
                  backgroundColor: "#34d399", 
                  color: "white",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease"
                }}
                onClick={handleAssign}
              >
                Assign
              </button>
              <button 
                style={{ 
                  padding: "0.4rem 0.8rem", 
                  borderRadius: "4px", 
                  border: "1px solid #334155", 
                  backgroundColor: "transparent", 
                  color: "#f1f5f9",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease"
                }}
                onClick={() => setAssigning(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              style={{ 
                padding: "0.4rem 0.8rem", 
                borderRadius: "4px", 
                border: "none", 
                backgroundColor: "#34d399", 
                color: "white",
                fontSize: "0.8rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background-color 0.2s ease"
              }}
              onClick={() => setAssigning(true)}
            >
              Assign
            </button>
          )
        )}
      </div>
    </div>
  );
}

// Create Task Modal 
export function CreateTaskModal({ onClose, onCreate, notify }) {
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
    <div style={{ 
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}>
      <div style={{ 
        background: "#1e293b", 
        padding: "2rem", 
        borderRadius: "8px", 
        width: "100%", 
        maxWidth: "500px"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "1.5rem"
        }}>
          <h2 style={{ 
            color: "#f1f5f9", 
            fontSize: "1.5rem", 
            fontFamily: "'DM Mono', monospace"
          }}>New Task</h2>
          <button 
            style={{ 
              padding: "0.25rem 0.5rem", 
              borderRadius: "4px", 
              border: "none", 
              backgroundColor: "#334155", 
              color: "#f1f5f9",
              cursor: "pointer"
            }}
            onClick={onClose}
          >×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input 
            style={{ 
              padding: "0.75rem", 
              borderRadius: "4px", 
              border: "1px solid #334155", 
              backgroundColor: "#0f172a", 
              color: "#f1f5f9"
            }}
            placeholder="Task title" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
          <textarea 
            style={{ 
              padding: "0.75rem", 
              borderRadius: "4px", 
              border: "1px solid #334155", 
              backgroundColor: "#0f172a", 
              color: "#f1f5f9",
              minHeight: "90px",
              resize: "vertical"
            }}
            placeholder="Description (optional)" 
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
          />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button 
              type="button" 
              style={{ 
                padding: "0.5rem 1rem", 
                borderRadius: "4px", 
                border: "none", 
                backgroundColor: "#334155", 
                color: "#f1f5f9",
                cursor: "pointer"
              }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{ 
                padding: "0.5rem 1rem", 
                borderRadius: "4px", 
                border: "none", 
                backgroundColor: "#34d399", 
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background-color 0.2s ease"
              }}
              disabled={loading}
            >
              {loading ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Employee Modal 
export function CreateEmployeeModal({ onClose, notify }) {
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
    <div style={{ 
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}>
      <div style={{ 
        background: "#1e293b", 
        padding: "2rem", 
        borderRadius: "8px", 
        width: "100%", 
        maxWidth: "500px"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "1.5rem"
        }}>
          <h2 style={{ 
            color: "#f1f5f9", 
            fontSize: "1.5rem", 
            fontFamily: "'DM Mono', monospace"
          }}>New Employee</h2>
          <button 
            style={{ 
              padding: "0.25rem 0.5rem", 
              borderRadius: "4px", 
              border: "none", 
              backgroundColor: "#334155", 
              color: "#f1f5f9",
              cursor: "pointer"
            }}
            onClick={onClose}
          >×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input 
            style={{ 
              padding: "0.75rem", 
              borderRadius: "4px", 
              border: "1px solid #334155", 
              backgroundColor: "#0f172a", 
              color: "#f1f5f9"
            }}
            placeholder="Full name" 
            value={fullName} 
            onChange={e => setFullName(e.target.value)} 
            required 
          />
          <input 
            style={{ 
              padding: "0.75rem", 
              borderRadius: "4px", 
              border: "1px solid #334155", 
              backgroundColor: "#0f172a", 
              color: "#f1f5f9"
            }}
            type="email"
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            style={{ 
              padding: "0.75rem", 
              borderRadius: "4px", 
              border: "1px solid #334155", 
              backgroundColor: "#0f172a", 
              color: "#f1f5f9"
            }}
            type="password"
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button 
              type="button" 
              style={{ 
                padding: "0.5rem 1rem", 
                borderRadius: "4px", 
                border: "none", 
                backgroundColor: "#334155", 
                color: "#f1f5f9",
                cursor: "pointer"
              }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{ 
                padding: "0.5rem 1rem", 
                borderRadius: "4px", 
                border: "none", 
                backgroundColor: "#34d399", 
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background-color 0.2s ease"
              }}
              disabled={loading}
            >
              {loading ? "Creating…" : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}