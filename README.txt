PAVAN MASALA — LOCAL FULL-STACK WEBSITE
======================================

This version keeps the existing storefront HTML sections and exact CSS design. The original inline CSS is moved unchanged into public/style.css. The existing script.js is connected as a separate file and enhanced for persistent cart, prices, saved orders, and newsletter subscriptions.

FEATURES
- Existing storefront design and sections retained
- Product search/filter, product modal, cart, recipes, FAQ, store locator, toast interactions
- Cart is remembered in this browser using localStorage
- Sample prices and total calculation (edit prices in server.js and the price values in public/script.js if changing product prices)
- Express backend and SQLite database
- Orders saved with customer information, items, quantities, price snapshots, total, date and status
- Local admin dashboard to view orders and update status
- Newsletter email subscriptions saved in SQLite
- Runs on your computer; no public hosting is required

REQUIREMENTS
1. Install Node.js LTS (18 or newer) from https://nodejs.org/.
2. Extract this folder and open it in VS Code.
3. Open VS Code Terminal > New Terminal.
4. Run: npm install
5. Copy .env.example to a new file named .env. On Windows PowerShell, run: Copy-Item .env.example .env
6. Open .env and change ADMIN_KEY to a private key you can remember. Do not upload .env to GitHub.
7. Run: npm start
8. Open the storefront at http://127.0.0.1:3000
9. Open order management at http://127.0.0.1:3000/admin.html and enter the ADMIN_KEY from .env.
10. Keep the terminal open while using the website. Press Ctrl+C in the terminal to stop the server.

TEST IT
- Add a spice to the cart and open the cart. Sample prices are shown in INR.
- Submit the order form. The order is saved in data/pavan-masala.db and an order number is shown.
- Visit admin.html, enter your admin key, and load orders. Change the status to Confirmed/Packed/Shipped/Delivered as needed.
- Submit an email in the newsletter area and view it from the admin dashboard.
- The database file is created automatically the first time the server starts.

SAMPLE PRICES
- Red Chilli Powder: ₹80
- Turmeric Powder: ₹70
- Coriander Powder: ₹65
- Garam Masala: ₹90
These are example prices only. Replace them with your actual project prices in server.js (seedProducts) and public/script.js (product data). If you already generated a database, updating seedProducts will not overwrite existing prices because the seeding uses INSERT OR IGNORE. For an existing local demo database, use a SQLite editor or delete data/pavan-masala.db while the server is stopped to recreate it with the current sample values. Deleting that file deletes saved demo orders/subscribers.

GITHUB
- Upload the project source, including package.json, package-lock.json (generated after npm install), public/, server.js, README.txt, and .gitignore.
- Do NOT upload .env, node_modules/, or data/pavan-masala.db.
- GitHub stores your code but does not run this Node.js backend by itself. For this local-only requirement, run npm start on your own computer. GitHub Pages can only serve the static frontend and cannot run this backend/database.

IMPORTANT LIMITS
- This project records order requests; it does not charge customers or connect to a real payment gateway, courier, email service, or WhatsApp.
- The admin key is a simple local-project access check, not production-grade authentication. Keep the server bound to 127.0.0.1 and never expose it to the internet without proper security.
- Store locator still displays the original “available soon” message; real store data would need to be added separately.
- Images in the original storefront keep their existing image URLs. A local copy of your supplied image assets is also included in public/images but the HTML image references are not changed.
