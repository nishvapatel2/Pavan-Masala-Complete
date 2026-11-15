require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1"; // local computer only by default
const ADMIN_KEY = process.env.ADMIN_KEY || "change-this-local-admin-key";

/* =========================================================
   PACKAGE WEIGHT AND TEMPORARY PRICES
========================================================= */
const PACKAGE_PRICES = {
    "Red Chilli Powder": {
        "100 g": 40,
        "200 g": 90,
        "500 g": 190
    },

    "Turmeric Powder": {
        "100 g": 35,
        "200 g": 70,
        "500 g": 175
    },

    "Coriander Powder": {
        "100 g": 30,
        "200 g": 60,
        "500 g": 150
    },

    "Garam Masala": {
        "10 g": 10
    }
};


const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "pavan-masala.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  price REAL NOT NULL CHECK(price >= 0),
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Received',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  package_size TEXT NOT NULL DEFAULT '100 g',
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  line_total REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
`);
/* =========================================================
   DATABASE MIGRATION: ADD PACKAGE SIZE
========================================================= */

const orderItemColumns = db.prepare(
    "PRAGMA table_info(order_items)"
).all();

if (!orderItemColumns.some(column => column.name === "package_size")) {
    db.exec(
        "ALTER TABLE order_items ADD COLUMN package_size TEXT NOT NULL DEFAULT '100 g'"
    );
}

// Demonstration prices. Change these here to match the prices you intend to use.
const seedProducts = [
    ["Red Chilli Powder", 40],
    ["Turmeric Powder", 35],
    ["Coriander Powder", 30],
    ["Garam Masala", 10]
];

const insertProduct = db.prepare(
    "INSERT OR IGNORE INTO products (name, price) VALUES (?, ?)"
);

const updateProductPrice = db.prepare(
    "UPDATE products SET price = ? WHERE name = ?"
);

for (const [name, price] of seedProducts) {
    insertProduct.run(name, price);
    updateProductPrice.run(price, name);
}

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/products", (req, res) => {
    const products = db.prepare(
        "SELECT id, name, price FROM products WHERE active = 1 ORDER BY id"
    ).all();

    res.json(products.map(product => ({
        ...product,
        prices: PACKAGE_PRICES[product.name] || {}
    })));
});

app.post("/api/orders", (req, res) => {
    const { customer, items } = req.body || {};

    if (
        !customer ||
        !Array.isArray(items) ||
        items.length < 1 ||
        items.length > 30
    ) {
        return res.status(400).json({
            error: "Please provide customer details and at least one product."
        });
    }

    const name = String(customer.name || "").trim();
    const phone = String(customer.phone || "").trim();
    const city = String(customer.city || "").trim();
    const address = String(customer.address || "").trim();

    if (name.length < 2 || name.length > 100) {
        return res.status(400).json({ error: "Enter a valid customer name." });
    }

    if (!/^\+?[0-9 ()-]{10,20}$/.test(phone) ||
        phone.replace(/\D/g, "").length < 10) {
        return res.status(400).json({ error: "Enter a valid phone number." });
    }

    if (city.length < 2 || city.length > 100) {
        return res.status(400).json({ error: "Enter a valid city." });
    }

    if (address.length < 5 || address.length > 500) {
        return res.status(400).json({
            error: "Enter a complete delivery address."
        });
    }

    const productLookup = db.prepare(
        "SELECT name FROM products WHERE name = ? AND active = 1"
    );

    const cleanItems = [];

    for (const item of items) {
        const product = productLookup.get(String(item.name || ""));
const packageSize = String(item.packageSize || "");
const quantity = Number(item.quantity);

if (!product) {
    return res.status(400).json({
        error: "A selected product, package size, or quantity is invalid."
    });
}

const productPrices = PACKAGE_PRICES[product.name];

if (
    !productPrices ||
    !Object.prototype.hasOwnProperty.call(productPrices, packageSize) ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 100
) {
    return res.status(400).json({
        error: "A selected product, package size, or quantity is invalid."
    });
}

const price = productPrices[packageSize];

        const existing = cleanItems.find(
            x => x.name === product.name && x.packageSize === packageSize
        );

        if (existing) {
            existing.quantity += quantity;

            if (existing.quantity > 100) {
                return res.status(400).json({
                    error: "Maximum quantity per product package is 100."
                });
            }
        } else {
            cleanItems.push({
                name: product.name,
                packageSize,
                price,
                quantity
            });
        }
    }

    const total = Number(
        cleanItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        ).toFixed(2)
    );

    try {
        const createOrder = db.transaction(() => {
            const info = db.prepare(`
                INSERT INTO orders
                    (customer_name, phone, city, address, total)
                VALUES (?, ?, ?, ?, ?)
            `).run(name, phone, city, address, total);

            const orderId = Number(info.lastInsertRowid);

            const insertItem = db.prepare(`
                INSERT INTO order_items
                    (order_id, product_name, package_size,
                     unit_price, quantity, line_total)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            cleanItems.forEach(item => {
                insertItem.run(
                    orderId,
                    item.name,
                    item.packageSize,
                    item.price,
                    item.quantity,
                    Number((item.price * item.quantity).toFixed(2))
                );
            });

            return orderId;
        });

        const orderId = createOrder();

        res.status(201).json({
            message: "Order saved",
            orderId,
            total
        });

    } catch (error) {
        console.error("Order database error:", error);

        res.status(500).json({
            error: "The order could not be saved. Please try again."
        });
    }
});

app.post("/api/newsletter", (req, res) => {
  const email = String((req.body || {}).email || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  try {
    const result = db.prepare("INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)").run(email);
    res.status(201).json({ message: result.changes ? "Thank you for subscribing!" : "This email is already subscribed." });
  } catch (error) {
    console.error("Newsletter database error:", error);
    res.status(500).json({ error: "Subscription could not be saved." });
  }
});

function requireAdmin(req, res, next) {
  const supplied = String(req.get("x-admin-key") || "");
  if (!ADMIN_KEY || supplied !== ADMIN_KEY) return res.status(401).json({ error: "Admin key is missing or incorrect." });
  next();
}
app.get("/api/admin/orders", requireAdmin, (req, res) => {
  const orders = db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 500").all();
  const items = db.prepare("SELECT product_name AS name, unit_price AS price, quantity, line_total AS lineTotal FROM order_items WHERE order_id = ?");
  res.json(orders.map(order => ({ ...order, items: items.all(order.id) })));
});
app.patch("/api/admin/orders/:id", requireAdmin, (req, res) => {
  const allowed = ["Received", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"];
  const status = String((req.body || {}).status || "");
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid order status." });
  const result = db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: "Order not found." });
  res.json({ ok: true, status });
});
app.get("/api/admin/subscribers", requireAdmin, (req, res) => {
  res.json(db.prepare("SELECT email, subscribed_at AS subscribedAt FROM newsletter_subscribers ORDER BY id DESC").all());
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});
app.listen(PORT, HOST, () => {
  console.log(`Pavan Masala is running at http://${HOST}:${PORT}`);
  console.log("Admin dashboard: http://127.0.0.1:" + PORT + "/admin.html");
  console.log("Database: data/pavan-masala.db");
});
