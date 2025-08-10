# VisualMind AI - Deployment Guide

## 🚀 Deployment Options

Your VisualMind AI project is now ready for deployment! Here are the recommended deployment options:

### Option 1: Netlify (Frontend) + Render (Backend) - **RECOMMENDED**

#### Frontend Deployment (Netlify)
1. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com) and sign up/login
   - Click "New site from Git" and connect your GitHub repository
   - Set build settings:
     - **Base directory:** `frontend`
     - **Build command:** `npm run build`
     - **Publish directory:** `frontend/dist`

2. **Environment Variables:**
   - In Netlify dashboard, go to Site settings > Environment variables
   - Add: `VITE_API_BASE=https://visualmind-ai-3.onrender.com`

#### Backend Deployment (Render)
1. **Connect to Render:**
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" > "Web Service"
   - Connect your GitHub repository

2. **Build Settings:**
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Environment:** Node

3. **Environment Variables:**
   - Add your `GROQ_API_KEY` in the Environment section
   - Add `NODE_ENV=production`

### Option 2: Vercel (Frontend Only)
1. **Deploy to Vercel:**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel --prod`
   - Follow the prompts

2. **Environment Variables:**
   - Add `VITE_API_BASE=https://visualmind-ai-3.onrender.com`

### Option 3: Docker Deployment
1. **Build and run:**
   ```bash
   docker build -t visualmind-ai .
   docker run -p 3000:3000 -e GROQ_API_KEY=your_key_here visualmind-ai
   ```

## 🔧 Pre-Deployment Checklist

- [x] ✅ Environment variables secured (API keys not in frontend)
- [x] ✅ Build scripts configured
- [x] ✅ Static file serving configured for production
- [x] ✅ CORS configured for cross-origin requests
- [x] ✅ Deployment configuration files created
- [x] ✅ .gitignore updated for production

## 🌍 Environment Variables

### Backend (.env)
```
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=production
PORT=3000
```

### Frontend (.env)
```
VITE_API_BASE=https://your-backend-url.com
```

## 🔄 Build Commands

### Frontend Build
```bash
cd frontend
npm install
npm run build
```

### Backend Start
```bash
cd backend
npm install
npm start
```

## 📝 Notes

- Your backend is already configured to serve the frontend in production
- The frontend is configured to proxy API calls to your backend
- All deployment configuration files are ready
- Security best practices are implemented

## 🆘 Troubleshooting

1. **Build fails:** Check Node.js version (requires Node 18+)
2. **API calls fail:** Verify CORS settings and API base URL
3. **Environment variables:** Ensure they're set in your deployment platform
4. **Static files not loading:** Check build output directory configuration

Choose your preferred deployment option and follow the steps above!
