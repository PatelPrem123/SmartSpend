# SmartSpend — Installation & Setup Guide (INSTALLATION.md)

Welcome to **SmartSpend**, a production-grade personal finance, multi-account ledger, and budgeting platform engineered for precision, tenant isolation, and automated wealth tracking.

---

## 1. System Requirements & Prerequisites

Before installing SmartSpend, ensure your development or host machine meets the following requirements:

| Component | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` (LTS) | `v20.x` or `v22.x` | Native ESM support enabled |
| **npm** | `>= 9.0.0` | `10.x` or `11.x` | Workspace & prefix support |
| **MongoDB** | `>= 6.0.0` | `7.0.x` | Standalone or Replica Set |
| **OS** | Windows, Linux, macOS | Ubuntu 22.04 LTS / Win 11 | Cross-platform compatibility |

---

## 2. Repository Architecture & Quick Structure

The repository utilizes an npm workspace layout:

```
SmartSpend/
├── server/               # Node.js + Express REST API Gateway (/api/v1) & node-cron daemon
│   ├── src/              # Application controllers, models, routes, services, validators
│   └── tests/            # Vitest + Supertest automated testing suites
├── client/               # React 18 SPA (Vite + Tailwind CSS + TanStack Query + Zustand)
│   └── src/              # Presentation components, pages, stores, and charts
├── package.json          # Monorepo root orchestration scripts
├── DECISIONS.md          # Architecture & Decision Governance
├── IMPACT-MAP.md         # Component dependency and change impact analysis
└── README.md             # Project overview
```

---

## 3. Environment Configuration

### Server Environment Variables (`server/.env`)

Create a `.env` file inside the `server/` directory:

```bash
# Server Port & Runtime
PORT=5000
NODE_ENV=development

# Database Connection (MongoDB 7.x)
MONGODB_URI=mongodb://localhost:27017/smartspend

# Security & JSON Web Tokens
JWT_SECRET=super_secret_jwt_key_smartspend_production_grade_hash_2026!
JWT_EXPIRES_IN=7d

# CORS Client Binding
CLIENT_URL=http://localhost:5173
```

### Client Environment Variables (`client/.env`)

Vite automatically proxies `/api/v1` requests to `http://localhost:5000` via `vite.config.js`. Optionally, you can specify:

```bash
VITE_API_URL=/api/v1
```

---

## 4. Step-by-Step Installation

### Step 1: Clone and Enter the Repository
```bash
git clone https://github.com/your-username/smartspend.git
cd smartspend
```

### Step 2: Install Server & Client Dependencies
From the repository root, install dependencies for both the backend and frontend:

```bash
# Install root, server, and client packages
npm install
npm --prefix server install
npm --prefix client install
```

### Step 3: Start MongoDB
Ensure your local MongoDB daemon is running:

- **Windows (PowerShell as Admin):**
  ```powershell
  net start MongoDB
  ```
- **Linux (systemd):**
  ```bash
  sudo systemctl start mongod
  sudo systemctl status mongod
  ```
- **macOS (Homebrew):**
  ```bash
  brew services start mongodb/brew/mongodb-community
  ```
- **Docker Alternative:**
  ```bash
  docker run -d -p 27017:27017 --name smartspend-mongo mongo:7.0
  ```

---

## 5. Running the Application

### Development Mode (Concurrent Server & Client)

From the root directory, launch both tiers simultaneously:

```bash
npm run dev
```

Or run each tier in separate terminal tabs:

**Terminal 1 — Backend API Gateway:**
```bash
npm --prefix server run dev
# Server running at http://localhost:5000
# REST API mounted at http://localhost:5000/api/v1
# node-cron recurring daemon initialized (runs daily at 00:01 AM)
```

**Terminal 2 — Frontend React SPA:**
```bash
npm --prefix client run dev
# Local Vite dev server: http://localhost:5173
```

---

## 6. Verifying Installation & Health Check

1. **Verify Backend Health:**
   Open your browser or run:
   ```bash
   curl http://localhost:5000/api/v1/health
   ```
   **Response:**
   ```json
   {
     "success": true,
     "service": "SmartSpend FinTech API Gateway",
     "version": "1.0.0",
     "status": "healthy",
     "timestamp": "2026-11-05T12:00:00.000Z",
     "uptimeSeconds": 15,
     "environment": "development"
   }
   ```

2. **Access Web Portal:**
   Navigate to [http://localhost:5173](http://localhost:5173). Register a new account to test automated category taxonomy seeding, dashboard initialization, and account management.

---

## 7. Running Automated Test Suites

SmartSpend includes 12 automated test suites covering 112 unit and integration tests across integer currency precision, dual-entry transfer neutrality, idempotent budget alerts, recurring cron jobs, CSV formula macro sanitization, savings milestones, and streaming document export:

```bash
# Execute entire test suite
npm test

# Run tests with live watch mode
npm --prefix server run test:watch
```

---

## 8. Production Build Verification

Verify that the frontend builds cleanly into optimized production assets:

```bash
npm --prefix client run build
```
Build output is generated into `client/dist/` ready for static deployment or reverse proxy serving.
