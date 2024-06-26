const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// SQLite database setup
const db = new sqlite3.Database('./database.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        category TEXT,
        instructions TEXT,
        image TEXT,
        user_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// Routes
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
        if (err) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const token = jwt.sign({ id: this.lastID }, 'supersecret');
        res.json({ token });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT id FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (!row) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: row.id }, 'supersecret');
        res.json({ token });
    });
});

const authenticate = (req, res, next) => {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, 'supersecret', (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

        req.userId = decoded.id;
        next();
    });
};

app.get('/api/recipes', authenticate, (req, res) => {
    db.all(`SELECT * FROM recipes WHERE user_id = ?`, [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch recipes' });
        res.json(rows);
    });
});

app.post('/api/recipes', authenticate, upload.single('image'), (req, res) => {
    const { title, category, instructions } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    db.run(`INSERT INTO recipes (title, category, instructions, image, user_id) VALUES (?, ?, ?, ?, ?)`,
        [title, category, instructions, image, req.userId], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to add recipe' });
        res.json({ id: this.lastID });
    });
});

app.delete('/api/recipes/:id', authenticate, (req, res) => {
    db.run(`DELETE FROM recipes WHERE id = ? AND user_id = ?`, [req.params.id, req.userId], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to delete recipe' });
        res.json({ success: true });
    });
});

// Serve static files (if needed)
app.use('/uploads', express.static('public/uploads'));

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
