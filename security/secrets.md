# Secrets & Credential Management (secrets.md)

**System:** SmartSpend (FinTech & Multi-Account Personal Wealth Management Platform)  
**Maintained For:** Security Reviewers, DevSecOps Engineers, AI Coding Agents  
**Document Version:** 1.0.0  

---

## 1. Secrets Inventory & Expected Locations

| Secret Name | Purpose & Consuming Service | Expected Source | Sensitivity Level | Risk if Compromised |
| :--- | :--- | :--- | :---: | :--- |
| **`PORT`** | Express HTTP Server listening port | Server `.env` | Low | Port conflict on deployment host. |
| **`NODE_ENV`** | Application environment (`development`, `production`, `test`) | System / Container Env | Low | Accidental exposure of verbose error stack traces in production. |
| **`MONGO_URI`** | MongoDB connection string (including cluster credentials) | Server `.env` | **CRITICAL** | Direct read/write access to all user accounts, transactions, and audit logs. |
| **`JWT_SECRET`** | Cryptographic key for signing & verifying JWT authentication tokens | Server `.env` | **CRITICAL** | Forgery of user session tokens, allowing complete account takeover. |
| **`JWT_EXPIRES_IN`** | Lifespan of JWT session tokens (e.g. `7d`) | Server `.env` | Medium | Prolonged exposure window if a token is compromised. |
| **`CLIENT_URL`** | Allowed CORS frontend origin (e.g. `http://localhost:5173`) | Server `.env` | Medium | Misconfiguration can allow unauthorized cross-origin requests. |

---

## 2. Environment & Configuration Handling

### 2.1 Server Configuration Architecture
- The server loads environment variables using `dotenv` at the top of `server/src/server.js` or `server/src/config/env.js`.
- Variables are validated on startup using a Zod schema to ensure required secrets (`MONGO_URI`, `JWT_SECRET`) are present before listening on the network:
  ```javascript
  const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
  });
  ```

### 2.2 Client Configuration Architecture
- The frontend client (Vite SPA) accesses environment variables via `import.meta.env.VITE_*`.
- **Absolute Rule:** NO secrets or database URIs must ever be prefixed with `VITE_` or bundled into client JavaScript. Only public variables such as `VITE_API_BASE_URL` are permitted on the client tier.

---

## 3. Threat Assessment & Exposure Risks

### 3.1 Hardcoded Secret Risks
- **Risk:** Embedding fallback keys (e.g. `const secret = process.env.JWT_SECRET || 'smartspend_secret_123';`) in source code.
- **Evaluation:** Fatal flaw. If environment variables fail to load in production, the application silently defaults to the known string, enabling universal token forgery.
- **Rule:** The server must crash immediately on startup (`process.exit(1)`) if `JWT_SECRET` or `MONGO_URI` is undefined. Never supply insecure fallback strings.

### 3.2 Client-Side Exposure Risks
- **Risk:** Accidental import of server configuration files into Vite components.
- **Evaluation:** Vite bundles all imported code into browser-deliverable JavaScript. If a model or config file containing database connection logic is imported into a React component, credentials become public.
- **Rule:** Strict directory separation between `server/` and `client/`. Client builds must not import from server directories.

### 3.3 Git & Repository History Risks
- **Risk:** Committing `.env` files containing live MongoDB Atlas credentials or production JWT secrets to Git.
- **Evaluation:** Once committed, secrets persist in Git reflogs and commit history even if deleted in subsequent commits.
- **Mitigation:**
  - `.gitignore` must explicitly include `.env`, `.env.local`, `.env.production`, and `*.pem`.
  - Provide a sanitized `.env.example` file with placeholder values only:
    ```bash
    PORT=5000
    NODE_ENV=development
    MONGO_URI=mongodb://localhost:27017/smartspend
    JWT_SECRET=replace_with_a_secure_random_64_character_hex_string
    JWT_EXPIRES_IN=7d
    CLIENT_URL=http://localhost:5173
    ```

### 3.4 Logging & Error Exposure Risks
- **Risk:** Printing `process.env` or database connection strings to console logs during debugging.
- **Evaluation:** Log aggregators (Datadog, CloudWatch, Papertrail) store logged secrets in plaintext.
- **Rule:** Never log `req.body` without sanitizing `password` fields. Suppress raw error objects containing MongoDB connection strings in API error responses.

---

## 4. Secret Rotation & Lifecycle Requirements

1. **JWT Secret Rotation:**
   - In the event of a suspected leak, `JWT_SECRET` must be rotated immediately in environment settings.
   - *Impact:* All active user sessions are invalidated, requiring re-authentication.
2. **MongoDB Atlas Credential Rotation:**
   - Create a secondary database user with readWrite privileges.
   - Update `MONGO_URI` on application instances and verify connection.
   - Revoke and delete the compromised database user.
3. **Entropy Standard:**
   - Production secrets must be generated using cryptographically secure random bytes:
     ```powershell
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

---

## 5. Actual Findings & Verification

- **Confirmed:** No hardcoded secrets, production passwords, or live database connection strings exist in the documentation or codebase.
- **Confirmed:** Architectural specification explicitly designates HttpOnly cookies for JWT delivery, preventing client-side script access.
- **Required Action:** Ensure `.gitignore` and `.env.example` are present and enforced before repository commits.
