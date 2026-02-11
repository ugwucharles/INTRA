# INTRA - Quick Start Guide

## Prerequisites
- Node.js installed
- PostgreSQL database running
- Database connection string configured in `.env` file

## Starting the Backend

### 1. Install dependencies (if not already done)
```bash
npm install
```

### 2. Set up database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 3. Start the backend server
```bash
# Development mode (with hot reload)
npm run start:dev

# The backend will run on http://localhost:3000
```

## Starting the Frontend

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies (if not already done)
```bash
npm install
```

### 3. Start the frontend dev server
```bash
npm run dev
```

### 4. Open your browser
The frontend will be available at:
- http://localhost:3001 (or 3000 if backend is on different port)

## Running Both (Two Terminal Windows)

### Terminal 1 - Backend:
```bash
# From project root
npm run start:dev
```

### Terminal 2 - Frontend:
```bash
# From project root
cd frontend
npm run dev
```

## Environment Variables

### Backend (.env in root)
```
DATABASE_URL="postgresql://user:password@localhost:5432/intra"
JWT_SECRET="your-secret-key"
PORT=3000
```

### Frontend (.env.local in frontend/)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## First Steps After Starting

1. Open http://localhost:3001 in your browser
2. Click "Create one" to register a new organization
3. Fill in your organization details and create an admin account
4. You'll be automatically logged in and redirected to the dashboard

## Troubleshooting

- **Backend won't start**: Make sure PostgreSQL is running and DATABASE_URL is correct
- **Frontend can't connect**: Check that backend is running on port 3000 and CORS is enabled
- **Port already in use**: Change PORT in backend .env or use different port for frontend

