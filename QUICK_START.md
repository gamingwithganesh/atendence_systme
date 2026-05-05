# 🚀 Quick Start Guide

## Local Development Setup

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create `.env` file** (copy from `.env.example`)
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your values**
   ```
   MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/attendance_db?retryWrites=true&w=majority
   JWT_SECRET=your_secret_key_here
   PORT=5000
   ```

4. **Start backend**
   ```bash
   npm start
   ```
   
   Backend runs on: `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start dev server**
   ```bash
   npm run dev
   ```
   
   Frontend runs on: `http://localhost:5173` (Vite default)

3. **Create `.env.local`** (optional for local overrides)
   ```
   VITE_API_BASE_URL=http://localhost:5000
   ```

### Test the App

1. Open `http://localhost:5173` in browser
2. Try logging in
3. Check browser console for any errors
4. API calls should go to `http://localhost:5000`

---

## Production Deployment on Render

See [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) for full instructions.

**Quick summary**:
1. Backend service: Root dir `backend`, port auto-detected
2. Frontend static site: Root dir `frontend`, publish dir `dist`
3. Set env vars in Render dashboard
4. Frontend's `VITE_API_BASE_URL` points to backend service URL

---

## File Structure Changes Made

- ✅ `frontend/src/config/api.js` — Centralized API base URL
- ✅ All frontend components updated to use `API_BASE_URL`
- ✅ `backend/.env.example` — Template for backend env vars
- ✅ `render.yaml` — Infrastructure as code for Render
- ✅ `RENDER_DEPLOYMENT_GUIDE.md` — Complete deployment guide

---

## API Base URL Logic

The frontend now uses this logic:
```javascript
// frontend/src/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
export default API_BASE_URL;
```

- **Local dev**: Uses `http://localhost:5001` (or your custom value)
- **Production**: Uses the `VITE_API_BASE_URL` env var from Render

---

## Troubleshooting

**Frontend can't connect to backend?**
- Check `VITE_API_BASE_URL` in Render environment variables
- Verify backend service is deployed and running
- Check browser DevTools → Network tab for API calls

**MongoDB connection error?**
- Verify `MONGO_URI` is correct in backend `.env`
- Check MongoDB whitelist includes Render's IPs
- Test connection string locally first

**Port conflicts?**
- Backend uses `PORT` env var (default 5000)
- Frontend uses Vite default (5173)
- Change in code if conflicts occur
