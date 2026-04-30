import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const statusLabels = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done"
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

const chartColors = ["#2563eb", "#14b8a6", "#f97316"];

function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

function getInitialTask(project) {
  return {
    title: "",
    description: "",
    dueDate: new Date().toISOString().slice(0, 10),
    priority: "medium",
    assignedTo: project?.members?.[0]?.user?._id || ""
  };
}

export default function App() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [taskForm, setTaskForm] = useState(getInitialTask());
  const [memberEmail, setMemberEmail] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const activeProject = projectDetails?.project;
  const tasks = projectDetails?.tasks || [];
  const isAdmin = projectDetails?.role === "admin";

  function isProjectOwner(project) {
    const ownerId = project?.owner?._id || project?.owner;
    return ownerId === user._id;
  }

  function syncProjectInList(updatedProject) {
    setProjects((current) =>
      current.map((project) =>
        project._id === updatedProject._id ? { ...project, ...updatedProject } : project
      )
    );
  }

  async function loadProjects() {
    const { data } = await api.get("/projects");
    setProjects(data.projects);
    if (!activeProjectId && data.projects[0]) {
      setActiveProjectId(data.projects[0]._id);
    }
  }

  async function loadProjectDetails(projectId) {
    if (!projectId) {
      setProjectDetails(null);
      setDashboard(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [detailsResponse, dashboardResponse] = await Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/projects/${projectId}/dashboard`)
    ]);
    setProjectDetails(detailsResponse.data);
    setDashboard(dashboardResponse.data);
    setTaskForm(getInitialTask(detailsResponse.data.project));
    setLoading(false);
  }

  useEffect(() => {
    loadProjects().catch(() => {
      setError("Could not load projects");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadProjectDetails(activeProjectId).catch(() => {
      setError("Could not load selected project");
      setLoading(false);
    });
  }, [activeProjectId]);

  const filteredTasks = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter((task) =>
      [task.title, task.description, task.assignedTo?.name, statusLabels[task.status]]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [query, tasks]);

  const statusChart = useMemo(() => {
    if (!dashboard) return [];
    return Object.entries(dashboard.byStatus).map(([status, value]) => ({
      name: statusLabels[status],
      value
    }));
  }, [dashboard]);

  async function handleCreateProject(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const { data } = await api.post("/projects", projectForm);
      setProjectForm({ name: "", description: "" });
      setProjects((current) => [data.project, ...current]);
      setActiveProjectId(data.project._id);
      setNotice("Project created");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not create project");
    }
  }

  async function handleDeleteProject(event, project) {
    event.stopPropagation();
    setError("");
    setNotice("");

    const confirmed = window.confirm(
      `Delete "${project.name}"? This will permanently remove the project and its tasks.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/projects/${project._id}`);
      const remainingProjects = projects.filter((item) => item._id !== project._id);
      setProjects(remainingProjects);

      if (activeProjectId === project._id) {
        const nextProject = remainingProjects[0];
        if (nextProject) {
          setActiveProjectId(nextProject._id);
        } else {
          setActiveProjectId("");
          setProjectDetails(null);
          setDashboard(null);
          setLoading(false);
        }
      }

      setNotice("Project deleted");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not delete project");
    }
  }

  async function handleAddMember(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const emailToAdd = memberEmail.trim().toLowerCase();
      const { data } = await api.post(`/projects/${activeProjectId}/members`, {
        email: memberEmail
      });
      const addedMember = data.project.members.find(
        (member) => member.user.email.toLowerCase() === emailToAdd
      );
      setMemberEmail("");
      setProjectDetails((current) => ({ ...current, project: data.project }));
      syncProjectInList(data.project);
      if (addedMember) {
        setTaskForm((current) => ({ ...current, assignedTo: addedMember.user._id }));
      }
      setNotice("Member added");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not add member");
    }
  }

  async function handleRemoveMember(userId) {
    setError("");
    setNotice("");

    try {
      const { data } = await api.delete(`/projects/${activeProjectId}/members/${userId}`);
      setProjectDetails((current) => ({ ...current, project: data.project }));
      syncProjectInList(data.project);
      await loadProjectDetails(activeProjectId);
      setNotice("Member removed");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not remove member");
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      await api.post(`/projects/${activeProjectId}/tasks`, taskForm);
      await loadProjectDetails(activeProjectId);
      setNotice("Task created");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not create task");
    }
  }

  async function updateTaskStatus(task, status) {
    setError("");
    setNotice("");

    try {
      await api.patch(`/projects/${activeProjectId}/tasks/${task._id}`, { status });
      await loadProjectDetails(activeProjectId);
      setNotice("Task updated");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not update task");
    }
  }

  async function deleteTask(taskId) {
    setError("");
    setNotice("");

    try {
      await api.delete(`/projects/${activeProjectId}/tasks/${taskId}`);
      await loadProjectDetails(activeProjectId);
      setNotice("Task deleted");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not delete task");
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <LayoutDashboard size={26} />
          <span>TeamFlow</span>
        </div>

        <form className="quick-create" onSubmit={handleCreateProject}>
          <label>
            New project
            <input
              value={projectForm.name}
              onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Project name"
              required
            />
          </label>
          <textarea
            value={projectForm.description}
            onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Short description"
          />
          <button className="primary-button" type="submit">
            <Plus size={18} />
            Create
          </button>
        </form>

        <nav className="project-list" aria-label="Projects">
          {projects.map((project) => (
            <div
              key={project._id}
              className={project._id === activeProjectId ? "project-item active" : "project-item"}
            >
              <button className="project-open" type="button" onClick={() => setActiveProjectId(project._id)}>
                <span>{project.name}</span>
                <small>{project.members.length} members</small>
              </button>
              {isProjectOwner(project) && (
                <button
                  className="icon-button project-delete"
                  type="button"
                  onClick={(event) => handleDeleteProject(event, project)}
                  aria-label={`Delete ${project.name}`}
                  title="Delete project"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Team task management</p>
            <h1>{activeProject?.name || "Your workspace"}</h1>
          </div>
          <div className="user-chip">
            <span>{user.name}</span>
            <button className="icon-button" type="button" onClick={logout} aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {error && <div className="error-box">{error}</div>}
        {notice && <div className="notice-box">{notice}</div>}

        {!loading && !activeProject && (
          <EmptyState title="Create your first project" message="Use the sidebar form to start a team workspace." />
        )}

        {loading && activeProjectId && <div className="panel">Loading project...</div>}

        {!loading && activeProject && (
          <>
            <section className="metrics-grid">
              <Metric icon={<ListTodo />} label="Total tasks" value={dashboard?.totalTasks || 0} />
              <Metric icon={<CircleDot />} label="In progress" value={dashboard?.byStatus?.in_progress || 0} />
              <Metric icon={<CheckCircle2 />} label="Completed" value={dashboard?.byStatus?.done || 0} />
              <Metric icon={<CalendarClock />} label="Overdue" value={dashboard?.overdue || 0} danger />
            </section>

            <section className="content-grid">
              <div className="panel chart-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Dashboard</p>
                    <h2>Task progress</h2>
                  </div>
                  <BarChart3 size={22} />
                </div>
                <div className="charts">
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={4}>
                        {statusChart.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={dashboard?.perUser || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="user.name" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Team</p>
                    <h2>Members</h2>
                  </div>
                  <Users size={22} />
                </div>
                <div className="member-list">
                  {activeProject.members.map((member) => (
                    <div className="member-row" key={member.user._id}>
                      <div>
                        <strong>{member.user.name}</strong>
                        <span>{member.user.email}</span>
                      </div>
                      <div className="member-actions">
                        <span className={`role-pill ${member.role}`}>{member.role}</span>
                        {isAdmin && member.user._id !== activeProject.owner._id && (
                          <button className="icon-button" type="button" onClick={() => handleRemoveMember(member.user._id)} aria-label="Remove member">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <form className="inline-form" onSubmit={handleAddMember}>
                    <input
                      value={memberEmail}
                      onChange={(event) => setMemberEmail(event.target.value)}
                      placeholder="member@email.com"
                      type="email"
                      required
                    />
                    <button className="secondary-button" type="submit">
                      <UserPlus size={17} />
                      Add
                    </button>
                  </form>
                )}
              </div>
            </section>

            <section className="content-grid tasks-layout">
              <div className="panel task-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">{projectDetails.role} access</p>
                    <h2>Tasks</h2>
                  </div>
                  <div className="search-box">
                    <Search size={17} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" />
                  </div>
                </div>

                {filteredTasks.length === 0 ? (
                  <EmptyState title="No tasks found" message="Create a task or adjust your search filter." />
                ) : (
                  <div className="task-list">
                    {filteredTasks.map((task) => (
                      <article className="task-card" key={task._id}>
                        <div className="task-title-row">
                          <div>
                            <h3>{task.title}</h3>
                            <p>{task.description || "No description added."}</p>
                          </div>
                          <span className={`priority-pill ${task.priority}`}>{priorityLabels[task.priority]}</span>
                        </div>
                        <div className="task-meta">
                          <span>{task.assignedTo?.name}</span>
                          <span>{formatDate(task.dueDate)}</span>
                          <span className={`status-pill ${task.status}`}>{statusLabels[task.status]}</span>
                        </div>
                        <div className="task-actions">
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <button
                              key={value}
                              className={task.status === value ? "status-button active" : "status-button"}
                              type="button"
                              onClick={() => updateTaskStatus(task, value)}
                            >
                              {label}
                            </button>
                          ))}
                          {isAdmin && (
                            <button className="icon-button danger" type="button" onClick={() => deleteTask(task._id)} aria-label="Delete task">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {isAdmin && (
                <form className="panel create-task" onSubmit={handleCreateTask}>
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Admin</p>
                      <h2>Create task</h2>
                    </div>
                    <Plus size={22} />
                  </div>
                  <label>
                    Title
                    <input
                      value={taskForm.title}
                      onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Task title"
                      required
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      value={taskForm.description}
                      onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="What needs to happen?"
                    />
                  </label>
                  <label>
                    Assignee
                    <select
                      value={taskForm.assignedTo}
                      onChange={(event) => setTaskForm((current) => ({ ...current, assignedTo: event.target.value }))}
                      required
                    >
                      {activeProject.members.map((member) => (
                        <option key={member.user._id} value={member.user._id}>
                          {member.user.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Due date
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Priority
                    <select
                      value={taskForm.priority}
                      onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <button className="primary-button" type="submit">
                    <Plus size={18} />
                    Add task
                  </button>
                </form>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ icon, label, value, danger }) {
  return (
    <div className={danger ? "metric-card danger" : "metric-card"}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
