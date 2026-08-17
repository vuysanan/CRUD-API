import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from './openapi.json' with { type: "json" };
import Database from "better-sqlite3";

const app = express();
const PORT = 3000;

app.use(express.json());

const db = new Database("tasks.db");

db.exec(` 
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY,
        title TEXT,
        done INTEGER
    )
`);

const { count } = db.prepare("SELECT COUNT(*) as count FROM tasks").get();
if (count === 0) {
    const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
    insert.run("Practice JavaScript", 1);
    insert.run("Build an API", 0);
    insert.run("Watch Kaizer Chiefs", 0);
}

function formatTask(task) {
    let formattedTask = {};
    formattedTask.id = task.id;
    formattedTask.title = task.title;

    if (task.done === 1) {
        formattedTask.done = true;
    } else {
        formattedTask.done = false;
    }
    return formattedTask;
}

/*const tasks = [
    { id: 1, title: "Practice JavaScript", done: true },
    { id: 2, title: "Build an API", done: false },
    { id: 3, title: "Watch Kaizer Chiefs", done: false }
]; */

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

// Stage 1: Read from the database

app.get("/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks").all();
    res.json(tasks.map(formatTask));
});

app.get("/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id);

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    if (!task) {
        return res.status(404).json({ error: `Task ${taskId} not found` });
    }
    res.json(formatTask(task));
});

// Stage 2: Create new tasks

app.post("/tasks", (req, res) => {
    const { title } = req.body;

    if (!title || title.trim() === "")
        return res.status(400).json({ error: "Title is required" });

    const insertTask = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
    const resultingTask = insertTask.run(title.trim(), 0);
    const newId = resultingTask.lastInsertRowid;

    const newTask = {
        id: newId,
        title: title.trim(),
        done: false
    };

    res.status(201).json(newTask);
});

// Stage 3: Update and delete

app.put("/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);

    if (!task) {
        return res.status(404).json({ error: `Task ${taskId} not found` });
    }

    const { title, done } = req.body;

    if (title === undefined && done === undefined) {
        return res.status(400).json({ error: "At least one field is required" });
    }

    let newTitle = task.title;
    let newDone = task.done;

    if (title !== undefined) {
        if (typeof title !== "string" || title.trim() === "") {
            return res.status(400).json({ error: "Title must be a non-empty string" });
        }
        newTitle = title.trim();
    }

    if (done !== undefined) {
        newDone = done ? 1 : 0;
    }

    db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?").run(newTitle, newDone, taskId);

    res.json(formatTask({ id: taskId, title: newTitle, done: newDone }));
});

app.delete("/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);

    if (!task) {
        return res.status(404).json({ error: `Task ${taskId} not found` });
    }

    db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
    res.sendStatus(204);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});