-- Pizza Ordering System — Database Schema

CREATE TABLE IF NOT EXISTS menu_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL,
    price       REAL    NOT NULL,
    category    TEXT    NOT NULL CHECK (category IN ('pizza', 'sides', 'drinks')),
    image_url   TEXT    NOT NULL DEFAULT '/images/default.png'
);

CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name  TEXT    NOT NULL,
    customer_email TEXT,
    phone          TEXT    NOT NULL,
    address        TEXT    NOT NULL,
    items          TEXT    NOT NULL,   -- JSON string: [{id, name, price, quantity}]
    total_price    REAL    NOT NULL,
    coupon_code    TEXT,
    discount       REAL    NOT NULL DEFAULT 0,
    final_price    REAL    NOT NULL,
    status         TEXT    NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'confirmed', 'delivered')),
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
