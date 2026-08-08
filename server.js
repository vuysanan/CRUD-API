import express from "express";
const app = express();
const PORT = 3000;

app.use(express.json());

const tasks = [
    { id: 1, title: "Practice JavaScript", done: true },
    { id: 2, title: "Build an API", done: false },
    { id: 3, title: "Watch Kaizer Chiefs", done: false }
];

app.get("/", (req, res) => {
    res.json({
        name: "Task API",
        version: "1.0",
        endpoints: ["/tasks"]
    });
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.get("/tasks", (req, res) => {
    res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ error: `Task ${taskId} not found` });
    }
    res.json(task);
});

app.post("/tasks", (req, res) => {
    const { title } = req.body;

    if (!title || title.trim() === "")
        return res.status(400).json({ error: "Title is required" });

    let newId;

    if (tasks.length > 0) {
        newId = tasks[tasks.length - 1].id + 1;
    } else {
        newId = 1;
    }

    const newTask = {
        id: newId,
        title: title.trim(),
        done: false
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});