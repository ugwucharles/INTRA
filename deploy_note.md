# INTRA Deployment Notes - cPanel Go-Live

This document summarizes the steps, challenges, and solutions encountered while deploying the INTRA project (NestJS backend & Next.js frontend) to a cPanel environment.

## 📁 Environment Information
- **Domain**: `intrabox.com.ng` (Frontend) / `api.intrabox.com.ng` (Backend)
- **Node.js Version**: 20.20.0 (CloudLinux Node.js Selector)
- **Database**: PostgreSQL (via standard connection string)

---

## 🛠 Backend Deployment (NestJS)

### 1. Prisma Version Conflict
- **Error**: `P1012 (get-config wasm)` - Prisma 7.x failed because the `url` property is handled differently in newer versions/engines.
- **Fix**: Downgraded Prisma and `@prisma/client` to **v5.22.0** to match the server's OpenSSL and Node capabilities.

### 2. Missing Database Driver Adapters
- **Error**: `Cannot find module '@prisma/adapter-pg'`.
- **Fix**: Installed `@prisma/adapter-pg` and `pg` packages on the server.

### 3. Missing Enums (TypeError on Boot)
- **Error**: `TypeError: Cannot convert undefined or null to object` during class-validator initialization.
- **Reason**: Prisma Enums used in DTOs were undefined because the client hadn't been generated on the server.
- **Fix**: Ran `npx prisma generate` in the backend folder.

### 4. Adapter Connection Crash
- **Error**: `Cannot read properties of undefined (reading 'bind')`.
- **Reason**: The `@prisma/adapter-pg` was either mismatched or misconfigured for the standard cPanel environment.
- **Fix**: **Simplified the connection Strategy**. Removed the adapter entirely from `src/prisma/prisma.service.ts` and allowed Prisma to connect natively using the `DATABASE_URL`. This is more stable for standard PostgreSQL setups.

---

## 🌐 Frontend Deployment (Next.js)

### 1. Build Strategy
- **Approach**: Used the **Next.js Standalone** build mode. 
- **Setup**: Zipped the `.next/standalone` folder, reaching a much smaller and more portable package.

### 2. cPanel Boilerplate Interference
- **Error**: Website showed a default "It works! Node 20.20.0" page.
- **Fix**: Changed the **Application startup file** in cPanel to `standalone/server.js`.

### 3. Missing Static Assets (Scattered Styling)
- **Error**: Website loaded but had no CSS or images.
- **Reason**: The `public` and `.next/static` folders were not inside the `standalone` folder where the server expects them.
- **Fix**: Re-zipped the frontend with the following structure:
  - `standalone/server.js`
  - `standalone/node_modules/`
  - `standalone/public/`
  - `standalone/.next/static/`

### 4. Linux Permissions (Permission Denied)
- **Error**: `MODULE_NOT_FOUND` or CSS failing to load.
- **Reason**: Files extracted from the zip had restrictive permissions (e.g., `node_modules` not being searchable).
- **Fix**: Ran the following commands in the frontend root:
  ```bash
  chmod -R 755 standalone/node_modules
  chmod -R 755 standalone/.next
  chmod -R 755 standalone/public
  ```

---

## 🚀 Final Configuration Checklist
- [ ] **Startup File (Backend)**: `dist/main.js`
- [ ] **Startup File (Frontend)**: `standalone/server.js`
- [ ] **Environment Variables**:
  - `DATABASE_URL` (Backend)
  - `NEXT_PUBLIC_API_URL=https://api.intrabox.com.ng` (Frontend)
  - `NODE_ENV=production`
