import { useState } from 'react';
import { apiFetch, useAuth } from './auth';

// Task status workflow
export const STATUS_ORDER = ["CREATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "DONE"];

export const STATUS_META = {
  CREATED: { label: "Created", color: "#f59e0b", bg: "#78350f" },
  ASSIGNED: { label: "Assigned", color: "#3b82f6", bg: "#1e3a8a" },
  IN_PROGRESS: { label: "In Progress", color: "#8b5cf6", bg: "#4c1d95" },
  RESOLVED: { label: "Resolved", color: "#34d399", bg: "#064e3b" },
  DONE: { label: "Done", color: "#10b981", bg: "#065f46" },
};

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

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
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
              background: "#a78bfa", 
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
                  background: "#34d399", 
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
                background: "#34d399", 
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