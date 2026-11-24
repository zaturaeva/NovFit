import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

const dataDir = path.resolve('server/data')
fs.mkdirSync(dataDir, { recursive: true })
export const db = new Database(path.join(dataDir, 'novfit.sqlite'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, nickname TEXT NOT NULL UNIQUE COLLATE NOCASE,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, points INTEGER NOT NULL DEFAULT 0, ranking_position INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS daily_logs (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 type TEXT NOT NULL CHECK(type IN ('water','sleep','meal','activity')), amount REAL NOT NULL,
 goal REAL, title TEXT, calories REAL, duration REAL, protein REAL NOT NULL DEFAULT 0, fat REAL NOT NULL DEFAULT 0, carbs REAL NOT NULL DEFAULT 0, date TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS daily_logs_user_date ON daily_logs(user_id,date);
CREATE TABLE IF NOT EXISTS friendships (
 id INTEGER PRIMARY KEY AUTOINCREMENT, requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status TEXT NOT NULL CHECK(status IN ('pending','accepted','rejected')) DEFAULT 'pending',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(requester_id,addressee_id)
);
CREATE TABLE IF NOT EXISTS messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS media_assets (
 id INTEGER PRIMARY KEY AUTOINCREMENT, source_url TEXT NOT NULL UNIQUE, image_data BLOB, content_type TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS articles (
 id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, category TEXT NOT NULL,
 read_minutes INTEGER NOT NULL DEFAULT 5, excerpt TEXT NOT NULL, author TEXT NOT NULL, body TEXT NOT NULL,
 image_url TEXT NOT NULL, image_asset_id INTEGER REFERENCES media_assets(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS message_reactions (id INTEGER PRIMARY KEY AUTOINCREMENT, message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, emoji TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(message_id,user_id,emoji));
CREATE TABLE IF NOT EXISTS article_likes (id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(article_id,user_id));
CREATE TABLE IF NOT EXISTS article_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS user_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, points INTEGER NOT NULL DEFAULT 1 CHECK(points=1), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS videos (
 id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT NOT NULL,
 duration TEXT NOT NULL, author TEXT NOT NULL, cover_url TEXT NOT NULL, youtube_id TEXT NOT NULL, image_asset_id INTEGER REFERENCES media_assets(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`)

// Миграции для уже существующих локальных баз данных.
const ensureColumn = (table, column, definition) => {
 const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name)
 if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}
ensureColumn('daily_logs', 'protein', 'REAL NOT NULL DEFAULT 0')
ensureColumn('daily_logs', 'fat', 'REAL NOT NULL DEFAULT 0')
ensureColumn('daily_logs', 'carbs', 'REAL NOT NULL DEFAULT 0')
ensureColumn('users', 'points', 'INTEGER NOT NULL DEFAULT 0')
ensureColumn('users', 'ranking_position', 'INTEGER')

ensureColumn('articles', 'image_asset_id', 'INTEGER REFERENCES media_assets(id)')
ensureColumn('videos', 'image_asset_id', 'INTEGER REFERENCES media_assets(id)')
