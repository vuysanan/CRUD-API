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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});