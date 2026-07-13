# Full-Stack E-Commerce Ordering & Payment System

A robust, enterprise-grade e-commerce backend and frontend application built with strict architectural guidelines. The system features modular user authentication, role-based access control (RBAC), advanced hierarchical category tree structures optimized with Depth-First Search (DFS) and Redis caching, and an extensible multi-provider payment engine integrating Stripe and bKash via the Strategy Design Pattern.

---

## System Architecture & Core Requirements

### 1. Architectural Patterns & Algorithms
* **Strategy Design Pattern:** Implemented across the payment processing core (`StripePaymentStrategy` and `BkashPaymentStrategy`) allowing seamless provider switching and future expansion without altering core ordering checkout flows.
* **Depth-First Search (DFS) & Hierarchical Traversals:** Category management uses a self-referencing hierarchy structure (e.g., *Electronics → Computers → Laptops → Gaming Laptops*). Recommending related products recursively triggers a DFS traversal to isolate all child subcategory nodes efficiently.
* **High-Performance Caching:** The entire hierarchical category tree is stored as an optimized adjacency list within a **Redis/Memcached** layer. On update, create, or deletion events, a cache invalidation hook purges and recomputes the tree to prevent stale database lookups.
* **Deterministic Inventory Control:** Employs precise atomic mathematical validation during the checkout lifecycle to safely reduce item stock levels upon payment confirmation.

---

## 🛠️ Feature Modules

### 1. User Management & Authentication
* JSON Web Token (JWT) stateless authorization layer.
* Strict backend email uniqueness validation.
* Frontend native JWT-decode mechanism to parse client payload claims and enforce Role-Based Access Control (RBAC).
* **Role-Based Access Boundaries:**
    * **Admin:** Complete CRUD capabilities over the products catalog and audit visibility over the global orders log.
    * **Customer/Regular User:** Restricted visibility enabling access only to personal profiles, individual transaction histories, and private orders.

### 2. Product & Category Management
* Full indexing across performance-critical tables (`Users`, `Products`, `Orders`, `OrderItems`, `Payments`, `Categories`).
* Fields managed: `id` (PK), `name`, `sku` (unique indexed string), `description`, `price`, `stock`, `status` (active/inactive), and high-resolution timestamps.

### 3. Order Management
* Relational model tracking granular client items via an `OrderItems` table containing `id`, `order_id` (FK), `product_id` (FK), `quantity`, `price`, and computed `subtotal`.
* Lifecycle states: `pending` ➔ `paid` ➔ `canceled`.

### 4. Extensible Payment Integration Engine
The core system leverages distinct client-server sequences optimized per third-party gateway constraints:

#### **Stripe Integration Flow**
1. **Card Capture:** Secure card data collection isolated completely within frontend **Stripe Elements (`CardElement`)** to strictly prevent raw card data from touching the application backend.
2. **Intent Initialization:** Frontend issues a POST request to `/api/payments/initialize/` returning a unified `transaction_id` and unique client secret string.
3. **Gateway Confirmation:** Frontend uses `stripe.confirmCardPayment()` to submit information directly to Stripe's servers.
4. **Backend Verification:** Client triggers `/api/payments/confirm/` supplying `transaction_id` and `provider`. The backend checks the API status map, adapting safely to transitory states (`succeeded`, `processing`).
5. **Asynchronous Webhooks:** Webhook view handler configured with public exceptions (`permission_classes = []`) captures detached `payment_intent.succeeded` transmissions over `/api/payments/webhooks/stripe/`.

#### **bKash Integration Flow**
1. **Checkout Initialization:** Frontend requests a payment identifier; backend talks directly to the server-side bKash Checkout API.
2. **External Gateway Handshake:** Employs standard tokenized redirects, moving the user temporarily out to the standard bKash external panel.
3. **Callback Processing:** Redirects back to the client interface passing a verified payment key, which the frontend proxies to `/api/payments/confirm/`.
4. **Backend Verification:** Backend runs server-to-server query verification calls against the official bKash API infrastructure before completing stock adjustment transitions.

---

## Deployment & Environment Configurations

### Frontend Deployment Environment (Vite + Vercel)
Avoid hardcoding absolute API URL roots or fallback relative paths (`/api`) inside your network client instances (e.g., `client.js` or `api.js`). Instead, abstract them into dedicated environment files. 

For environment files to bind properly into modern compilers (like `vite:oxc`), you **must** stop the local dev context via `Ctrl + C` and restart the build stack.

Create a `.env.development` or `.env.production` file in the frontend root folder:

### Backend + Database Deployment Environment (render)
Appliction url = https://e-comm-rust-gamma.vercel.app/
