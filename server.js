import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from './openapi.json' with { type: "json" };
import 'dotenv/config';
import pkg from 'pg'
const { Pool } = pkg;

const app = express();
const PORT = 3000;

app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

async function initializeDatabase(){
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title TEXT,
            done BOOLEAN)
        `);

        const result = await pool.query("SELECT COUNT(*) as count FROM tasks");
        if (parseInt(result.rows[0].count) === 0) {
            await pool.query("INSERT INTO tasks (title, done) VALUES ($1, $2)", ["Practice JavaScript", true]);
            await pool.query("INSERT INTO tasks (title, done) VALUES ($1, $2)", ["Build an API", true]);
            await pool.query("INSERT INTO tasks (title, done) VALUES ($1, $2)", ["Watch Kaizer Chiefs", false]);
            console.log("Database seeded with tasks.");
        }
    } catch (err) {
        console.error("Database initialization error:", err);
    }
}

initializeDatabase();

/* Here lies the remains of assignment 2

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
} */

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

// Read from the database

app.get("/tasks", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tasks");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/tasks/:id", async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);

        const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [taskId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Task ${taskId} not found` });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new tasks

app.post("/tasks", async (req, res) => {
    try  {
        const { title } = req.body;

        if (!title || title.trim() === "")
            return res.status(400).json({ error: "Title is required" });

        const result = await pool.query("INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *", [title.trim(), false]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stage 3: Update and delete

app.put("/tasks/:id", async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [taskId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Task ${taskId} not found` });
        }

        const task = result.rows[0];
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
            if (typeof done !== "boolean") {
                return res.status(400).json({ error: "Done must be a boolean" });
            }

            newDone = done;
        }

        const updateRes = await pool.query("UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *", [newTitle, newDone, taskId]);

        res.json(updateRes.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/tasks/:id", async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [taskId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Task ${taskId} not found` });
        }

        await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
        res.sendStatus(204);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});