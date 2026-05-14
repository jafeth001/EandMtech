import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthContext, apiFetch } from './components/auth';
import { useAuth } from './components/auth';
import { Toast, LoginPage, TaskCard, CreateTaskModal, CreateEmployeeModal } from './components/ui';

// Main App Component
function App() {
  const [user, setUser] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [showCreateTask, setShowCreateTask] = React.useState(false);
  const [showCreateEmployee, setShowCreateEmployee] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Notification function
  const notify = (msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Auth context value
  const authValue = {
    user,
    token: user?.token,
    login: setUser,
    logout: () => setUser(null)
  };

  // Fetch tasks and employees after login
  React.useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        const [tasksRes, employeesRes] = await Promise.all([
          apiFetch("/tasks", {}, user.token),
          apiFetch("/users?role=EMPLOYEE", {}, user.token)
        ]);
        
        setTasks(tasksRes);
        setEmployees(employeesRes);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Protected routes component
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <LoginPage onLogin={setUser} notify={notify} />;
    }
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (error) {
      return <div>Error: {error}</div>;
    }
    
    return children;
  };

  // Handle task status change
  const handleStatusChange = (updatedTask) => {
    setTasks(prev => 
      prev.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
  };

  // Handle task assignment
  const handleAssign = (updatedTask) => {
    setTasks(prev => 
      prev.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
  };

  // Create new task
  const handleCreateTask = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
    setShowCreateTask(false);
  };

  // Create new employee
  const handleCreateEmployee = (newEmployee) => {
    setEmployees(prev => [...prev, newEmployee]);
    setShowCreateEmployee(false);
  };

  return (
    <AuthContext.Provider value={authValue}>
      <div>
        <Toast toasts={toasts} />
        
        <ProtectedRoute>
          <div className="container">
            <header style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "2rem"
            }}>
              <div>
                <h1>TaskFlow</h1>
                <p>Collaborative Task Management</p>
              </div>
              
              <div style={{ display: "flex", gap: "1rem" }}>
                {user?.user?.role === "SUPERVISOR" && (
                  <>
                    <button 
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
                      onClick={() => setShowCreateTask(true)}
                    >
                      Create Task
                    </button>
                    <button 
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
                      onClick={() => setShowCreateEmployee(true)}
                    >
                      Add Employee
                    </button>
                  </>
                )}
                <button 
                  style={{ 
                    padding: "0.5rem 1rem", 
                    borderRadius: "4px", 
                    border: "none", 
                    backgroundColor: "#334155", 
                    color: "#f1f5f9",
                    cursor: "pointer"
                  }}
                  onClick={() => authValue.logout()}
                >
                  Logout
                </button>
              </div>
            </header>
            
            <main>
              <h2>Tasks</h2>
              <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                {tasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onStatusChange={handleStatusChange} 
                    onAssign={handleAssign} 
                    employees={employees} 
                    isSupervisor={user?.user?.role === "SUPERVISOR"} 
                    notify={notify} 
                  />
                ))}
              </div>
            </main>
          </div>
        </ProtectedRoute>
        
        {showCreateTask && (
          <CreateTaskModal 
            onClose={() => setShowCreateTask(false)} 
            onCreate={handleCreateTask} 
            notify={notify} 
          />
        )}
        
        {showCreateEmployee && (
          <CreateEmployeeModal 
            onClose={() => setShowCreateEmployee(false)} 
            notify={notify} 
          />
        )}
      </div>
    </AuthContext.Provider>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);