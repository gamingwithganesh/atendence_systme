# 📦 Render Deployment Guide

This guide will help you deploy your attendance system on Render with full frontend-backend integration.

---

## 📋 Prerequisites

- GitHub/GitLab/Bitbucket account with your repo pushed
- MongoDB Atlas account (free tier available at https://www.mongodb.com/cloud/atlas)
- Render account (free tier available at https://render.com)
- Backend environment variables ready

---

## 🔧 Step 1: Set Up MongoDB

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Add a database user with username and password
4. Whitelist your IP (or allow all: 0.0.0.0/0)
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/attendance_db?retryWrites=true&w=majority
   ```

Save this — you'll need it for Render.

---

## 🚀 Step 2: Deploy Backend on Render

### 2.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub/GitLab repo
4. Fill in these details:

| Field | Value |
|-------|-------|
| **Name** | `attendance-backend` |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (or Paid) |

### 2.2 Add Environment Variables

In the Render dashboard, go to **Environment** and add:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance_db?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long
```

**Important**: Use a strong JWT secret (at least 32 characters).

### 2.3 Deploy

Click **Create Web Service**. Render will auto-deploy.

Once deployment finishes, you'll see a URL like: `https://attendance-backend.onrender.com`

**Test it**: Visit `https://attendance-backend.onrender.com/` — you should see `API is running...`

---

## 🎨 Step 3: Deploy Frontend on Render

### 3.1 Create Static Site

1. In Render Dashboard, click **New** → **Static Site**
2. Connect the same repo
3. Fill in these details:

| Field | Value |
|-------|-------|
| **Name** | `attendance-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### 3.2 Add Environment Variable

Go to **Environment** and add:

```
VITE_API_BASE_URL=https://attendance-backend.onrender.com
```

**Replace** `attendance-backend` with your actual backend service name if different.

### 3.3 Deploy

Click **Create Static Site**. Render will build and deploy.

Once done, you'll get a URL like: `https://attendance-frontend.onrender.com`

**Test it**: Visit the frontend URL — the app should load and connect to the backend.

---

## ✅ Step 4: Verify Deployment

1. **Backend Health**
   - Visit `https://attendance-backend.onrender.com/`
   - Should return: `API is running...`

2. **Frontend Loading**
   - Visit your frontend URL
   - App should load without errors
   - Open browser DevTools → Console for any errors

3. **Login Test**
   - Try logging in with a test account
   - If it works, backend-frontend connection is good

---

## 🔄 Step 5: Configure CORS (If Needed)

Your backend already has CORS enabled in `server.js`:

```javascript
app.use(cors());
```

If you get CORS errors, update it to:

```javascript
app.use(cors({
  origin: 'https://attendance-frontend.onrender.com',
  credentials: true
}));
```

Then redeploy the backend.

---

## 📝 Step 6: Environment Variables Reference

### Backend (`backend/.env`)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance_db?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

### Frontend (Render Dashboard only)
```
VITE_API_BASE_URL=https://attendance-backend.onrender.com
```

The frontend code already uses this in `frontend/src/config/api.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
```

---

## 🐛 Troubleshooting

### **Backend shows "internal server error"**
- Check logs in Render Dashboard
- Verify `MONGO_URI` is correct
- Check MongoDB whitelist allows Render IPs

### **Frontend can't connect to backend**
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend URL in browser DevTools → Network tab
- Make sure backend is deployed first

### **"Cannot GET /" on backend**
- Normal — backend is API only, no root endpoint
- Test with `https://your-backend-url/api/auth/login` (should give 404 or method error)

### **Redeploy needed**
- Any code changes: push to GitHub, Render auto-redeploys
- Env var changes: redeployment needed manually (click Redeploy button)

---

## 📦 Optional: Use `render.yaml` for One-Click Deploy

Create `render.yaml` in repo root (already done):

```yaml
services:
  - type: web
    name: attendance-backend
    ...
  - type: static
    name: attendance-frontend
    ...
```

Then link this file in Render for automated infrastructure setup.

---

## 🔐 Security Tips

1. **JWT Secret**: Use a strong, random secret (not `secret123`)
2. **MongoDB**: Whitelist only Render IPs or use VPC
3. **CORS**: Restrict to your frontend domain in production
4. **Env Vars**: Never commit `.env` files, only `.env.example`

---

## 📞 Next Steps

- Monitor logs in Render Dashboard
- Set up automatic redeploys on GitHub push
- Add custom domain (Render supports this)
- Scale up to paid plan if needed

---

**Done!** Your attendance system is now live on Render! 🎉
