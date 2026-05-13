import { useState, useEffect, useContext, createContext, useCallback } from "react";

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

function AppProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [favorites, setFavorites] = useState([]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const toggleFavorite = (id, type) => {
    const key = `${type}-${id}`;
    setFavorites((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const isFavorite = (id, type) => favorites.includes(`${type}-${id}`);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, toggleFavorite, isFavorite }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  return useContext(AppContext);
}

// ─── API SERVICES ─────────────────────────────────────────────────────────────
const BASE = "https://jsonplaceholder.typicode.com";

const tasksApi = {
  getAll: () => fetch(`${BASE}/todos?_limit=10`).then((r) => r.json()),
  create: (task) =>
    fetch(`${BASE}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    }).then((r) => r.json()),
  delete: (id) => fetch(`${BASE}/todos/${id}`, { method: "DELETE" }),
  toggle: (id, completed) =>
    fetch(`${BASE}/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    }).then((r) => r.json()),
};

const notesApi = {
  getAll: () => fetch(`${BASE}/posts?_limit=8`).then((r) => r.json()),
  create: (note) =>
    fetch(`${BASE}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    }).then((r) => r.json()),
  delete: (id) => fetch(`${BASE}/posts/${id}`, { method: "DELETE" }),
};

// ─── REUSABLE UI COMPONENTS ───────────────────────────────────────────────────
function Button({ children, variant = "primary", disabled, onClick, type = "button", style }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    transition: "all 0.15s ease",
    opacity: disabled ? 0.5 : 1,
    ...style,
  };
  const variants = {
    primary: { background: "#1a1a2e", color: "#fff" },
    secondary: { background: "transparent", color: "var(--text)", border: "1.5px solid var(--border)" },
    danger: { background: "#e24b4a", color: "#fff" },
    ghost: { background: "transparent", color: "var(--text-muted)", border: "none", padding: "6px 10px" },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

function Input({ label, id, error, value, onChange, placeholder, type = "text", multiline, rows = 3 }) {
  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: error ? "1.5px solid #e24b4a" : "1.5px solid var(--border)",
    background: "var(--bg-input)",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
    resize: multiline ? "vertical" : undefined,
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label htmlFor={id} style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea id={id} value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={inputStyle} />
      ) : (
        <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
      )}
      {error && <p style={{ color: "#e24b4a", fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "16px 18px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ children, color = "gray" }) {
  const colors = {
    gray: { bg: "#f1efe8", text: "#5f5e5a" },
    green: { bg: "#eaf3de", text: "#3b6d11" },
    red: { bg: "#fcebeb", text: "#a32d2d" },
    blue: { bg: "#e6f1fb", text: "#185fa5" },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 500,
      padding: "2px 8px",
      borderRadius: 6,
      background: c.bg,
      color: c.text,
    }}>
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{
        width: 28,
        height: 28,
        border: "3px solid var(--border)",
        borderTop: "3px solid #7f77dd",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
    </div>
  );
}

// ─── SIMPLE ROUTER ────────────────────────────────────────────────────────────
function useRouter() {
  const [path, setPath] = useState(window.location.hash.replace("#", "") || "/tasks");
  useEffect(() => {
    const handler = () => setPath(window.location.hash.replace("#", "") || "/tasks");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const navigate = (to) => { window.location.hash = to; };
  return { path, navigate };
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function NavBar({ path, navigate }) {
  const { theme, toggleTheme } = useApp();
  const links = [
    { to: "/tasks", label: "Tasks", icon: "✓" },
    { to: "/notes", label: "Notes", icon: "📝" },
    { to: "/about", label: "About", icon: "ℹ" },
  ];
  return (
    <nav style={{
      background: "var(--bg-nav)",
      borderBottom: "1px solid var(--border)",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 56,
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#7f77dd", letterSpacing: -0.5 }}>TaskHub</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>mini</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {links.map((l) => (
          <button
            key={l.to}
            onClick={() => navigate(l.to)}
            style={{
              background: path === l.to ? "#1a1a2e" : "transparent",
              color: path === l.to ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
      <button
        onClick={toggleTheme}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "5px 12px",
          fontSize: 13,
          cursor: "pointer",
          color: "var(--text)",
        }}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
    </nav>
  );
}

// ─── TASKS PAGE ───────────────────────────────────────────────────────────────
function TasksPage() {
  const { toggleFavorite, isFavorite } = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    tasksApi.getAll().then((data) => {
      setTasks(data.map((t) => ({ ...t, createdAt: new Date(Date.now() - Math.random() * 1e10).toLocaleDateString() })));
      setLoading(false);
    });
  }, []);

  const validateTitle = (val) => {
    if (!val.trim()) return "Title is required";
    if (val.trim().length < 3) return "Title must be at least 3 characters";
    return "";
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (titleError) setTitleError(validateTitle(e.target.value));
  };

  const handleAdd = useCallback(() => {
    const err = validateTitle(title);
    if (err) { setTitleError(err); return; }
    const optimisticTask = {
      id: Date.now(),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toLocaleDateString(),
    };
    setTasks((prev) => [optimisticTask, ...prev]);
    setTitle("");
    tasksApi.create({ title: optimisticTask.title, completed: false, userId: 1 }).catch(() => {
      setTasks((prev) => prev.filter((t) => t.id !== optimisticTask.id));
    });
  }, [title]);

  const handleToggle = async (id, completed) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
    await tasksApi.toggle(id, !completed);
  };

  const handleDelete = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await tasksApi.delete(id);
  };

  const filtered = tasks.filter((t) => {
    if (filter === "done") return t.completed;
    if (filter === "undone") return !t.completed;
    return true;
  });

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text)" }}>Tasks</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{doneCount}/{tasks.length} done</span>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, marginTop: 0 }}>Add new task</p>
        <Input
          id="task-title"
          label="Title"
          value={title}
          onChange={handleTitleChange}
          placeholder="What needs to be done?"
          error={titleError}
        />
        <Button variant="primary" onClick={handleAdd}>
          {submitting ? "Adding…" : "+ Add Task"}
        </Button>
      </Card>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["all", "undone", "done"].map((f) => (
          <Button key={f} variant={filter === f ? "primary" : "secondary"} onClick={() => setFilter(f)} style={{ padding: "5px 12px", fontSize: 13 }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No tasks here yet.</p>
          )}
          {filtered.map((task) => (
            <Card key={task.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task.id, task.completed)}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#7f77dd" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  textDecoration: task.completed ? "line-through" : "none",
                  color: task.completed ? "var(--text-muted)" : "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {task.title}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{task.createdAt}</p>
              </div>
              <Badge color={task.completed ? "green" : "gray"}>{task.completed ? "Done" : "Pending"}</Badge>
              <button
                onClick={() => toggleFavorite(task.id, "task")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4 }}
                title={isFavorite(task.id, "task") ? "Remove favorite" : "Add to favorites"}
              >
                {isFavorite(task.id, "task") ? "★" : "☆"}
              </button>
              <Button variant="ghost" onClick={() => handleDelete(task.id)} style={{ color: "#e24b4a", padding: "4px 8px" }}>
                ✕
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NOTES PAGE ───────────────────────────────────────────────────────────────
function NotesPage() {
  const { toggleFavorite, isFavorite } = useApp();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", body: "" });
  const [errors, setErrors] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    notesApi.getAll()
      .then((data) => {
        setNotes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.body.trim()) e.body = "Body is required";
    else if (form.body.trim().length < 10) e.body = "Body must be at least 10 characters";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAdd = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const optimisticNote = { id: Date.now(), title: form.title.trim(), body: form.body.trim() };
    setNotes((prev) => [optimisticNote, ...prev]);
    setForm({ title: "", body: "" });
    notesApi.create({ ...optimisticNote, userId: 1 }).catch(() => {
      setNotes((prev) => prev.filter((n) => n.id !== optimisticNote.id));
    });
  };

  const handleDelete = async (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await notesApi.delete(id);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text)" }}>Notes</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>{notes.length} notes total</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, marginTop: 0 }}>New note</p>
        <Input
          id="note-title"
          label="Title"
          value={form.title}
          onChange={handleChange("title")}
          placeholder="Note title"
          error={errors.title}
        />
        <Input
          id="note-body"
          label="Body"
          value={form.body}
          onChange={handleChange("body")}
          placeholder="Write your note (min 10 characters)…"
          error={errors.body}
          multiline
          rows={3}
        />
        <Button variant="primary" onClick={handleAdd}>
          + Add Note
        </Button>
      </Card>

      {loading ? <Spinner /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {notes.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 32, gridColumn: "1/-1" }}>No notes yet.</p>
          )}
          {notes.map((note) => (
            <Card key={note.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <p style={{ flex: 1, margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>
                  {note.title}
                </p>
                <button
                  onClick={() => toggleFavorite(note.id, "note")}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0 }}
                >
                  {isFavorite(note.id, "note") ? "★" : "☆"}
                </button>
              </div>
              <p style={{
                margin: 0,
                fontSize: 13,
                color: "var(--text-muted)",
                lineHeight: 1.6,
                display: "-webkit-box",
                WebkitLineClamp: expanded === note.id ? "unset" : 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {note.body}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <button
                  onClick={() => setExpanded(expanded === note.id ? null : note.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#7f77dd", padding: 0 }}
                >
                  {expanded === note.id ? "Show less" : "Read more"}
                </button>
                <Button variant="ghost" onClick={() => handleDelete(note.id)} style={{ color: "#e24b4a", padding: "3px 8px", fontSize: 13 }}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "40px 16px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", letterSpacing: -1 }}>
          Mini <span style={{ color: "#7f77dd" }}>TaskHub</span>
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, lineHeight: 1.7 }}>
          A compact productivity app built with React — managing your tasks and notes in one place.
        </p>
      </div>

      {[
        { icon: "✓", title: "Tasks", desc: "Create, complete, and delete todos. Filter by status. Backed by JSONPlaceholder API with optimistic updates." },
        { icon: "📝", title: "Notes", desc: "Store quick notes with title and body. Form validation ensures quality input before saving." },
        { icon: "🌙", title: "Themes", desc: "Light and dark mode toggle, managed via React Context API and persisted for the session." },
        { icon: "★", title: "Favorites", desc: "Star any task or note to mark it as a favorite — global state via Context, local to each item." },
      ].map((item) => (
        <Card key={item.title} style={{ marginBottom: 12, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{item.title}</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{item.desc}</p>
          </div>
        </Card>
      ))}

      <Card style={{ marginTop: 24, background: "var(--bg-accent)" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--text)" }}>Stack:</strong> React 18, Context API, JSONPlaceholder REST API, hash-based routing, CSS variables for theming, controlled forms with validation.
        </p>
      </Card>
    </div>
  );
}

// ─── 404 PAGE ─────────────────────────────────────────────────────────────────
function NotFoundPage({ navigate }) {
  return (
    <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center", padding: "0 16px" }}>
      <p style={{ fontSize: 72, fontWeight: 800, color: "#7f77dd", margin: "0 0 8px", lineHeight: 1 }}>404</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", margin: "0 0 12px" }}>Page not found</h2>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
      <Button variant="primary" onClick={() => navigate("/tasks")}>Go to Tasks</Button>
    </div>
  );
}

// ─── THEME STYLES ─────────────────────────────────────────────────────────────
const lightTheme = {
  "--text": "#1a1a2e",
  "--text-muted": "#6b6b80",
  "--bg": "#f8f8fc",
  "--bg-card": "#ffffff",
  "--bg-nav": "rgba(248,248,252,0.92)",
  "--bg-input": "#fff",
  "--bg-accent": "#f1efe8",
  "--border": "#e2e2ec",
};

const darkTheme = {
  "--text": "#e8e8f0",
  "--text-muted": "#8888a0",
  "--bg": "#0f0f1a",
  "--bg-card": "#1a1a2e",
  "--bg-nav": "rgba(15,15,26,0.92)",
  "--bg-input": "#141428",
  "--bg-accent": "#1e1e32",
  "--border": "#2e2e48",
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { theme } = useApp();
  const { path, navigate } = useRouter();
  const vars = theme === "light" ? lightTheme : darkTheme;

  const cssVars = Object.entries(vars).map(([k, v]) => `${k}: ${v}`).join(";");

  const pages = {
    "/tasks": <TasksPage />,
    "/notes": <NotesPage />,
    "/about": <AboutPage />,
  };

  const page = pages[path] ?? <NotFoundPage navigate={navigate} />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Segoe UI', system-ui, sans-serif", ...vars }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        :root { ${cssVars} }
        input, textarea { transition: border-color 0.15s; }
        input:focus, textarea:focus { border-color: #7f77dd !important; outline: none; }
        button:hover:not(:disabled) { opacity: 0.85; }
      `}</style>
      <NavBar path={path} navigate={navigate} />
      <main>{page}</main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}