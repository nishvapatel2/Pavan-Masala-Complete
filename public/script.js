/* =========================================================
   PRODUCT DATA
========================================================= */

const products = {

    "Red Chilli Powder": {
        description:
        "Pavan Red Chilli Powder brings vibrant colour, balanced heat and authentic flavour to everyday Indian cooking.",

        image: "images/chilli.jpg",

        prices: {
            "100 g": 40,
            "200 g": 90,
            "500 g": 190
        }
    },

    "Turmeric Powder": {
        description:
        "Pavan Turmeric Powder brings golden colour and warm earthy flavour to every Indian kitchen.",

        image: "images/turmeric.jpg",

        prices: {
            "100 g": 35,
            "200 g": 70,
            "500 g": 175
        }
    },

    "Coriander Powder": {
        description:
        "Pavan Coriander Powder adds fresh aroma and balanced flavour to everyday meals.",

        image: "images/daniya.jpg",

        prices: {
            "100 g": 30,
            "200 g": 60,
            "500 g": 150
        }
    },

    "Garam Masala": {
        description:
        "Pavan Garam Masala is an aromatic blend that adds warmth and flavour to Indian dishes.",

        image: "images/garam masala.jpg",

        prices: {
            "10 g": 10
        }
    }

};

let currentProduct = "";

/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMenu(){

    document
    .getElementById("navLinks")
    .classList.toggle("active");

}


/* =========================================================
   PRODUCT FILTER
========================================================= */

function filterProducts(category,button){

    document
    .querySelectorAll(".filter-btn")
    .forEach(btn=>{
        btn.classList.remove("active");
    });

    button.classList.add("active");

    document
    .querySelectorAll(".product-card")
    .forEach(card=>{

        if(
            category === "all" ||
            card.dataset.category === category
        ){
            card.style.display = "";
        }
        else{
            card.style.display = "none";
        }

    });

}


/* =========================================================
   PRODUCT SEARCH
========================================================= */

function searchProducts(){

    const query =
    document
    .getElementById("productSearch")
    .value
    .toLowerCase();

    document
    .querySelectorAll(".product-card")
    .forEach(card=>{

        const name =
        card.dataset.name;

        card.style.display =
        name.includes(query)
        ? ""
        : "none";

    });

}


/* =========================================================
   PRODUCT DETAILS
========================================================= */

function showProduct(name, selectedSize) {

    currentProduct = name;
    const product = products[name];

    if (!product) return;

    document.getElementById("modalTitle").textContent = name;

    document.getElementById("modalDescription").textContent =
        product.description;

    document.getElementById("modalImage").src = product.image;

    const sizeSelect =
        document.getElementById("modalPackageSize");

    sizeSelect.innerHTML = "";

    Object.keys(product.prices).forEach(size => {
        const option = document.createElement("option");

        option.value = size;
        option.textContent = size;

        sizeSelect.appendChild(option);
    });

    if (
        selectedSize &&
        product.prices[selectedSize] !== undefined
    ) {
        sizeSelect.value = selectedSize;
    }

    updateModalProductPrice();

    document.getElementById("productModal").classList.add("active");

    document.body.classList.add("no-scroll");
}

function updateModalProductPrice() {
    const product = products[currentProduct];

    if (!product) return;

    const size = document.getElementById("modalPackageSize").value;
    const price = product.prices[size];

    document.getElementById("modalProductPrice").textContent =
        price !== undefined ? formatINR(price) : "Price unavailable";
}


function updateProductPrice(productName, packageSize) {
    const product = products[productName];

    if (!product) return;

    const price = product.prices[packageSize];

    const priceIds = {
        "Red Chilli Powder": "price-chilli",
        "Turmeric Powder": "price-turmeric",
        "Coriander Powder": "price-coriander",
        "Garam Masala": "price-garam"
    };

    const priceElement =
        document.getElementById(priceIds[productName]);

    if (priceElement && price !== undefined) {
        priceElement.textContent = formatINR(price);
    }
}


function addModalProduct() {

    const packageSize = document.getElementById("modalPackageSize").value;

    addToCart(currentProduct, packageSize);

    closeModal();
}


/* =========================================================
   CART
========================================================= */

const CART_STORAGE_KEY = "pavanMasalaCart";
let cart = [];
try {
    const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (Array.isArray(savedCart)) {
        cart = savedCart
    .filter(item =>
        products[item.name] &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    )
    .map(item => ({
    ...item,
    packageSize:
        item.packageSize &&
        products[item.name].prices[item.packageSize] !== undefined
            ? item.packageSize
            : Object.keys(products[item.name].prices)[0]
}));
    }
} catch (error) {
    cart = [];
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function formatINR(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 2
    }).format(amount);
}


function addToCart(productName, packageSize) {
    const product = products[productName];

    if (!product) {
        showToast("Product not found.");
        return;
    }

    // If a button or other HTML element was passed accidentally,
    // use the selected package size from the product card instead.
    if (typeof packageSize !== "string" ||
        product.prices[packageSize] === undefined) {

        const card = [...document.querySelectorAll(".product-card")]
            .find(card => card.dataset.name === productName);

        const packageSelect = card?.querySelector(".package-select");

        packageSize = packageSelect?.value;

        // Fall back to the first valid package if needed.
        if (!packageSize || product.prices[packageSize] === undefined) {
            packageSize = Object.keys(product.prices)[0];
        }
    }

    const existing = cart.find(
        item =>
            item.name === productName &&
            item.packageSize === packageSize
    );

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            name: productName,
            packageSize: packageSize,
            quantity: 1
        });
    }

    saveCart();
    updateCart();

    showToast(
        `${productName} (${packageSize}) added to cart.`
    );
}

function updateCart() {

    const count = cart.reduce(
        (sum, item) => sum + item.quantity, 0
    );

    const total = cart.reduce((sum, item) => {
        const product = products[item.name];
        const packageSize =
    item.packageSize &&
    product.prices[item.packageSize] !== undefined
        ? item.packageSize
        : Object.keys(product.prices)[0];
        const price = product.prices[packageSize];

        return sum + (price * item.quantity);
    }, 0);

    document.getElementById("cartCount").textContent = count;

    const container = document.getElementById("cartItems");

    if (cart.length === 0) {
        container.innerHTML =
            `<div class="empty-cart">Your cart is empty.</div>`;
    } else {
        container.innerHTML = cart.map((item, index) => {
            const product = products[item.name];

const packageSize =
    item.packageSize &&
    product.prices[item.packageSize] !== undefined
        ? item.packageSize
        : Object.keys(product.prices)[0];

const price = product.prices[packageSize];

            return `
            <div class="cart-item">
                <img src="${product.image}" alt="${item.name}">
                <div>
                    <h4>${item.name}</h4>
                    <small>Package: ${packageSize}</small><br>
                    <small>${formatINR(price)} each</small><br>
                    <small>Quantity: ${item.quantity}</small><br>
                    <small><strong>${formatINR(price * item.quantity)}</strong></small>
                </div>
                <button class="remove-item"
                    onclick="removeFromCart(${index})"
                    aria-label="Remove ${item.name}">×</button>
            </div>`;
        }).join("");
    }

    document.getElementById("cartTotal").textContent =
        formatINR(total);
}


function removeFromCart(index){
    cart.splice(index, 1);
    saveCart();
    updateCart();
}


function openCart(){

    document
    .getElementById("cartPanel")
    .classList.add("open");

}


function closeCart(){

    document
    .getElementById("cartPanel")
    .classList.remove("open");

}


/* =========================================================
   ORDER FORM
========================================================= */

function openOrderForm(){

    if(cart.length === 0){

        showToast(
            "Please add a product first."
        );

        return;

    }

    document
    .getElementById("orderModal")
    .classList.add("active");

}


function closeOrderForm(){

    document
    .getElementById("orderModal")
    .classList.remove("active");

}


async function submitOrder(event) {

    event.preventDefault();

    if (cart.length === 0) {
        showToast("Please add a product first.");
        return;
    }

    const submitButton = event.submitter ||
        document.querySelector(".order-form button[type='submit']");

    if (submitButton) submitButton.disabled = true;

    const order = {
        customer: {
            name: document.getElementById("customerName").value.trim(),
            phone: document.getElementById("customerPhone").value.trim(),
            city: document.getElementById("customerCity").value.trim(),
            address: document.getElementById("customerAddress").value.trim()
        },

        items: cart.map(item => ({
    name: item.name,
    packageSize:
        item.packageSize &&
        products[item.name].prices[item.packageSize] !== undefined
            ? item.packageSize
            : Object.keys(products[item.name].prices)[0],
    quantity: item.quantity
}))
    };

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(order)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.error || "Could not save your order. Please try again."
            );
        }

        closeOrderForm();
        closeCart();

        cart = [];
        saveCart();
        updateCart();

        event.target.reset();

        showToast(
    `Order #${result.orderId} saved successfully! Total: ${formatINR(result.total)}`
);

    } catch (error) {
        console.error("Order submission failed:", error);

        showToast(
            error.message ||
            "Unable to connect to the local server. Start it and try again."
        );

    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}


/* =========================================================
   RECIPE FILTER
========================================================= */

function filterRecipes(category,button){

    document
    .querySelectorAll(".recipe-filter")
    .forEach(btn=>{
        btn.classList.remove("active");
    });

    button.classList.add("active");


    document
    .querySelectorAll(".recipe-card")
    .forEach(card=>{

        if(
            category === "all" ||
            card.dataset.recipe === category
        ){
            card.style.display = "";
        }
        else{
            card.style.display = "none";
        }

    });

}


/* =========================================================
   FAQ
========================================================= */

function toggleFaq(button){

    const item =
    button.parentElement;

    item.classList.toggle("open");

    const plus =
    button.querySelector(".faq-plus");

    plus.textContent =
    item.classList.contains("open")
    ? "−"
    : "+";

}


/* =========================================================
   STORE LOCATOR
========================================================= */

function findStore(){

    const city =
    document
    .getElementById("city")
    .value;

    if(!city){

        showToast(
            "Please select a city."
        );

        return;

    }

    showToast(
        "Store locator for " +
        city +
        " will be available soon."
    );

}


/* =========================================================
   NEWSLETTER
========================================================= */

async function subscribe(){
    const input = document.getElementById("email");
    const email = input.value.trim();
    if (!email) {
        showToast("Please enter your email.");
        return;
    }
    try {
        const response = await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Subscription could not be saved.");
        input.value = "";
        showToast(result.message || "Thank you for subscribing!");
    } catch (error) {
        console.error("Newsletter subscription failed:", error);
        showToast(error.message || "Unable to connect to the local server.");
    }
}

/* =========================================================
   TOAST
========================================================= */

let toastTimer;

function showToast(message){

    const toast =
    document
    .getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
    setTimeout(()=>{
        toast.classList.remove("show");
    },2500);

}


/* =========================================================
   COUNTER ANIMATION
========================================================= */

const counters =
document.querySelectorAll(".number");

const observer =
new IntersectionObserver(
entries=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            const element =
            entry.target;

            const target =
            parseInt(
                element.dataset.target
            );

            let current = 0;

            const interval =
            setInterval(()=>{

                current++;

                element.textContent =
                current;

                if(current >= target){
                    clearInterval(interval);
                }

            },150);

            observer.unobserve(element);

        }

    });

},
{
    threshold:.5
});


counters.forEach(
    counter =>
    observer.observe(counter)
);


/* =========================================================
   CLOSE MODALS WHEN CLICKING BACKDROP
========================================================= */

document
.getElementById("productModal")
.addEventListener("click",function(event){

    if(event.target === this){
        closeModal();
    }

});


document
.getElementById("orderModal")
.addEventListener("click",function(event){

    if(event.target === this){
        closeOrderForm();
    }

});


/* =========================================================
   INITIALIZE
========================================================= */


async function loadServerProductPrices() {
    try {
        const response = await fetch("/api/products");

        if (!response.ok) return;

        const serverProducts = await response.json();

        serverProducts.forEach(item => {
            if (products[item.name] && item.prices) {
                products[item.name].prices = item.prices;
            }
        });

        // Refresh displayed package prices, if the helper exists.
        if (typeof updateProductPrice === "function") {
            document.querySelectorAll(".product-card").forEach(card => {
                const select = card.querySelector(".package-select");

                if (select) {
                    const name = card.dataset.name;
                    if (name) updateProductPrice(name, select.value);
                }
            });
        }

        
        // Correct saved cart package sizes using the latest prices.
        cart = cart.map(item => {
            const product = products[item.name];

            const packageSize =
                item.packageSize &&
                product.prices[item.packageSize] !== undefined
                    ? item.packageSize
                    : Object.keys(product.prices)[0];

            return {
                ...item,
                packageSize: packageSize
            };
        });

        saveCart();
        updateCart();

    } catch (error) {
        console.warn("Could not load server product prices.", error);
    }
}



saveCart();
updateCart();
loadServerProductPrices();
