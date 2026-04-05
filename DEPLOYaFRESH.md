# Fresh cPanel Deployment Guide

Follow these steps to deploy the latest version of INTRA to your cPanel hosting.

## 1. Upload Files
1. Log in to cPanel **File Manager**.
2. Upload `backend-deploy-v2.zip` to your backend folder (e.g., `api.intrabox.com.ng`).
3. Upload `frontend-deploy-v2.zip` to your frontend folder (e.g., `intrabox.com.ng`).
4. Extract both files in their respective folders.

## 2. Install/Update Dependencies
In the cPanel **Terminal**:

### Backend
```bash
cd /path/to/backend
npm install --production
```

### Frontend
Next.js Standalone includes its own minimal `node_modules`, so you typically don't need to run `npm install` for the frontend if you extracted it correctly.

## 3. Database Updates (CRITICAL)
If you had issues with the `orgId` migration, run the following fix script first:
```bash
cd /path/to/backend
node fix_migration.js
```
Then, ensure Prisma is in sync:
```bash
npx prisma migrate deploy
```

## 4. Restart the Applications
In cPanel **Setup Node.js App**:
1. Find your backend app and click **Restart**.
2. Find your frontend app and click **Restart**.
   - **Important**: Ensure the "Application startup file" for the frontend is set to `server.js`.

## 5. Environment Variables
Check that your `.env` files on cPanel have the correct production values:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_API_URL`
