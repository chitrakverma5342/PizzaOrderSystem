const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'pizza_order.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

// ─── Wrapper classes ────────────────────────────────────────────
// These provide a better-sqlite3–style API (.all(), .get(), .run())
// on top of sql.js, so our route handlers stay clean.

class PreparedStatement {
    constructor(database, sql) {
        this.database = database;
        this.sql = sql;
    }

    /** Returns all matching rows as an array of objects. */
    all(...params) {
        const stmt = this.database.prepare(this.sql);
        if (params.length > 0) stmt.bind(params);

        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    }

    /** Returns the first matching row as an object, or undefined. */
    get(...params) {
        const stmt = this.database.prepare(this.sql);
        if (params.length > 0) stmt.bind(params);

        let result = undefined;
        if (stmt.step()) {
            result = stmt.getAsObject();
        }
        stmt.free();
        return result;
    }

    /** Executes a write statement. Returns { lastInsertRowid, changes }. */
    run(...params) {
        this.database.run(this.sql, params);

        const idRow = this.database.exec('SELECT last_insert_rowid() AS id');
        const lastInsertRowid = idRow.length > 0 ? idRow[0].values[0][0] : 0;
        const changes = this.database.getRowsModified();

        // Persist to disk after every write
        saveDatabase();

        return { lastInsertRowid, changes };
    }
}

class DatabaseWrapper {
    constructor(sqlJsDb) {
        this._db = sqlJsDb;
    }

    /** Returns a PreparedStatement with .all(), .get(), .run() helpers. */
    prepare(sql) {
        return new PreparedStatement(this._db, sql);
    }

    /** Executes raw SQL (DDL, multi-statement scripts, etc.). */
    exec(sql) {
        this._db.run(sql);
    }
}

// ─── Persistence helpers ────────────────────────────────────────

function saveDatabase() {
    if (!db) return;
    const data = db._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Opens (or creates) the SQLite database, runs the schema,
 * and seeds menu items if the table is empty.
 * Must be awaited before the server starts accepting requests.
 */
async function initializeDatabase() {
    const SQL = await initSqlJs();

    // Load existing DB file if present, otherwise start fresh
    let sqlJsDb;
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        sqlJsDb = new SQL.Database(fileBuffer);
    } else {
        sqlJsDb = new SQL.Database();
    }

    db = new DatabaseWrapper(sqlJsDb);

    // Run schema (IF NOT EXISTS keeps it safe for re-runs)
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);

    // Seed menu items if table is empty
    const count = db.prepare('SELECT COUNT(*) AS count FROM menu_items').get();
    if (count.count === 0) {
        seedMenuItems();
    }

    console.log('✅ Database initialized successfully');
    return db;
}

/**
 * Seeds the menu_items table with sample pizza, sides, and drinks.
 */
function seedMenuItems() {
    const items = [
        // Pizzas
        { name: 'Margherita',     desc: 'Classic tomato sauce, fresh mozzarella, and basil',       price: 8.99,  cat: 'pizza',  img: '/images/margherita.jpg' },
        { name: 'Pepperoni',      desc: 'Loaded with spicy pepperoni and melted cheese',           price: 10.99, cat: 'pizza',  img: '/images/pepperoni.jpg' },
        { name: 'BBQ Chicken',    desc: 'Grilled chicken, red onions, and smoky BBQ sauce',        price: 12.99, cat: 'pizza',  img: '/images/bbq-chicken.jpg' },
        { name: 'Veggie Supreme', desc: 'Bell peppers, mushrooms, olives, onions, and tomatoes',   price: 11.49, cat: 'pizza',  img: '/images/veggie-supreme.jpg' },
        { name: 'Meat Feast',     desc: 'Pepperoni, sausage, ham, and ground beef',                price: 13.99, cat: 'pizza',  img: '/images/meat-feast.jpg' },
        // Sides
        { name: 'Garlic Bread',   desc: 'Crispy bread with garlic butter and herbs',               price: 4.49,  cat: 'sides',  img: '/images/garlic-bread.webp' },
        { name: 'Chicken Wings',  desc: '8 crispy wings with your choice of dipping sauce',        price: 7.99,  cat: 'sides',  img: '/images/chicken-wings.webp' },
        { name: 'Caesar Salad',   desc: 'Romaine lettuce, croutons, parmesan, Caesar dressing',    price: 5.99,  cat: 'sides',  img: '/images/caesar-salad.webp' },
        // Drinks
        { name: 'Cola',           desc: 'Classic refreshing cola — 500ml',                         price: 1.99,  cat: 'drinks', img: '/images/cola.webp' },
        { name: 'Lemonade',       desc: 'Freshly squeezed lemonade — 500ml',                       price: 2.49,  cat: 'drinks', img: '/images/lemonade.webp' },
    ];

    for (const item of items) {
        db.prepare(
            'INSERT INTO menu_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)'
        ).run(item.name, item.desc, item.price, item.cat, item.img);
    }

    console.log(`🌱 Seeded ${items.length} menu items`);
}

/**
 * Returns the current DatabaseWrapper instance.
 * Throws if the database has not been initialized yet.
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

module.exports = { initializeDatabase, getDatabase };
