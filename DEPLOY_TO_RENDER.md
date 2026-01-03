# 🚀 Deploying CodeCalm to Render

This guide will help you deploy CodeCalm to Render in full working mode with PostgreSQL database and all features enabled.

## 📋 Prerequisites

Before deploying, make sure you have:

1. A [Render account](https://render.com) (free tier available)
2. Your API keys ready:
   - **GROQ_API_KEY** (for Student/Parent/Professional bots)
   - **OPENROUTER_API_KEY** (for CodeGent)
   - **TAVILY_api_key** (for FitnessBot research)
   - **OPEN_WEATHER_API_KEY** (for WeatherFood)
3. This repository pushed to GitHub, GitLab, or Bitbucket

## 🎯 Quick Deploy (Recommended)

### Option 1: Using Blueprint (render.yaml)

This is the **easiest and recommended method** - everything is configured automatically!

1. **Push your code to Git**

   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Deploy on Render**

   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **"New +"** → **"Blueprint"**
   - Connect your repository
   - Render will automatically detect `render.yaml` and create:
     - ✅ Web Service (codecalm)
     - ✅ PostgreSQL Database (codecalm-db)
   - Click **"Apply"**

3. **Set Environment Variables**

   After deployment starts, go to your web service and add these environment variables:

   - `GROQ_API_KEY` = `your-groq-api-key`
   - `OPENROUTER_API_KEY` = `your-openrouter-api-key`
   - `TAVILY_api_key` = `your-tavily-api-key`
   - `OPEN_WEATHER_API_KEY` = `your-weather-api-key`

   _(DATABASE_URL and SECRET_KEY are auto-configured)_

4. **Wait for Build**

   - Initial build takes 3-5 minutes
   - Database will be automatically created and initialized
   - Health check will verify everything is working

5. **Access Your App**
   - Your app will be live at: `https://codecalm.onrender.com`
   - Test the health endpoint: `https://codecalm.onrender.com/health`

---

## 🔧 Manual Deploy (Alternative)

If you prefer to set up manually:

### Step 1: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `codecalm-db`
   - **Database:** `codecalm`
   - **User:** `codecalm`
   - **Region:** Choose nearest to you
   - **Plan:** Free
3. Click **"Create Database"**
4. Copy the **Internal Database URL** (starts with `postgres://`)

### Step 2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your repository
3. Configure:
   - **Name:** `codecalm`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Runtime:** `Python 3`
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn --chdir backend --bind 0.0.0.0:$PORT main:app --workers 2 --timeout 120`
   - **Plan:** Free

### Step 3: Set Environment Variables

Add these in the "Environment" section:

```
DATABASE_URL=<paste-internal-database-url-here>
FLASK_ENV=production
SECRET_KEY=<random-secret-key>
GROQ_API_KEY=<your-groq-api-key>
OPENROUTER_API_KEY=<your-openrouter-api-key>
TAVILY_api_key=<your-tavily-api-key>
OPEN_WEATHER_API_KEY=<your-weather-api-key>
```

To generate a secure SECRET_KEY:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Step 4: Configure Health Check

- **Health Check Path:** `/health`
- This ensures Render knows your app is running properly

### Step 5: Deploy

Click **"Create Web Service"** and wait for deployment!

---

## 🧪 Verify Deployment

Once deployed, test these endpoints:

1. **Homepage:** `https://your-app.onrender.com/`
2. **Health Check:** `https://your-app.onrender.com/health`
   - Should return: `{"status": "healthy", "database": "healthy", ...}`
3. **Login Page:** `https://your-app.onrender.com/frontend/html/login.html`

---

## 🎨 All Available Features

After deployment, users can access:

| Feature             | URL                                | Description                 |
| ------------------- | ---------------------------------- | --------------------------- |
| **Login**           | `/frontend/html/login.html`        | User authentication         |
| **StudentBot**      | `/frontend/html/student.html`      | Academic support (Maya)     |
| **ParentBot**       | `/frontend/html/parent.html`       | Parenting guidance          |
| **ProfessionalBot** | `/frontend/html/professional.html` | Career wellness (Luna)      |
| **CodeGent**        | `/frontend/html/codegent.html`     | Advanced coding assistant   |
| **FitnessBot**      | `/frontend/html/fitnessbot.html`   | Health & fitness coaching   |
| **WeatherFood**     | `/frontend/html/weatherfood.html`  | Weather-based meal planning |
| **ZenMode**         | `/frontend/html/zenmode.html`      | Mindfulness & meditation    |

---

## 🔍 Troubleshooting

### Build Fails

**Problem:** Build script fails to execute

**Solution:** Make build.sh executable:

```bash
git update-index --chmod=+x build.sh
git commit -m "Make build.sh executable"
git push
```

### Database Connection Error

**Problem:** `database: unhealthy` in health check

**Solutions:**

1. Verify `DATABASE_URL` environment variable is set correctly
2. Make sure you're using the **Internal Database URL** (not External)
3. Check database is in the same region as web service
4. Restart web service after adding DATABASE_URL

### API Keys Not Working

**Problem:** Bots return errors or "AI backend unavailable"

**Solutions:**

1. Double-check all API keys are entered correctly (no extra spaces)
2. Verify API keys are active and have credits/quota
3. Check logs in Render Dashboard for specific error messages
4. Test each API key individually:
   - Groq: https://console.groq.com
   - OpenRouter: https://openrouter.ai
   - Tavily: https://tavily.com
   - OpenWeather: https://openweathermap.org

### App Shows "Application Error"

**Problem:** Render shows application error

**Solutions:**

1. Check **Logs** tab in Render Dashboard
2. Verify `FLASK_ENV=production` is set
3. Ensure all dependencies in `requirements.txt` installed successfully
4. Restart the service

### Slow First Response (Cold Starts)

**Problem:** First request takes 30+ seconds

**Explanation:** Render's free tier spins down services after 15 minutes of inactivity. First request "wakes up" the service.

**Solutions:**

- Upgrade to paid tier for always-on service
- Accept cold starts on free tier (subsequent requests are fast)
- Use a ping service to keep app awake during business hours

---

## 💰 Cost Breakdown

### Render Costs

| Service         | Free Tier       | Paid Tier             |
| --------------- | --------------- | --------------------- |
| **Web Service** | 750 hours/month | $7/month (always on)  |
| **PostgreSQL**  | Free (90 days)  | $7/month (persistent) |

⚠️ **Important:** Free PostgreSQL databases are deleted after 90 days. Upgrade for production use.

### API Costs

- **Groq:** Free tier includes 14,400 requests/day
- **OpenRouter:** Pay-per-use (~$0.50/M tokens for Claude)
- **Tavily:** Free tier includes 1,000 searches/month
- **OpenWeather:** Free tier includes 1,000 calls/day

---

## 🚀 Post-Deployment Optimization

### 1. Custom Domain

Add your own domain:

1. Go to **Settings** → **Custom Domain**
2. Add your domain (e.g., `codecalm.yourdomain.com`)
3. Update DNS records as instructed
4. Free SSL certificate automatically provisioned

### 2. Scale Workers

For production traffic:

```yaml
# In render.yaml, update:
startCommand: "gunicorn --chdir backend --bind 0.0.0.0:$PORT main:app --workers 4 --timeout 120"
```

### 3. Enable Auto-Deploy

In Render Dashboard:

- **Settings** → **Auto-Deploy:** ON
- Every push to `main` branch auto-deploys

### 4. Monitor Performance

- Check **Metrics** tab for response times
- Review **Logs** for errors and warnings
- Set up **Alerts** for downtime

### 5. Backup Database

Download database backups regularly:

```bash
# Install PostgreSQL client
# Then download backup
pg_dump $DATABASE_URL > codecalm_backup.sql
```

---

## 🎉 Success Checklist

- [ ] Repository pushed to Git
- [ ] Render Blueprint deployed successfully
- [ ] PostgreSQL database created and connected
- [ ] All 4 API keys configured
- [ ] Health check returns `{"status": "healthy"}`
- [ ] Login page loads correctly
- [ ] Can create account and sign in
- [ ] All 7 AI assistants respond properly
- [ ] Custom domain configured (optional)
- [ ] Database backup scheduled (production)

---

## 📞 Support

If you encounter issues:

1. **Check Logs:** Render Dashboard → Your Service → Logs tab
2. **Health Check:** Visit `/health` endpoint to see what's failing
3. **Render Docs:** https://render.com/docs
4. **Render Community:** https://community.render.com

---

## 🔄 Update Deployment

To deploy code changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render will automatically rebuild and redeploy (if auto-deploy is enabled).

---

**🎊 Congratulations!** Your CodeCalm platform is now live and helping people worldwide! 🌍
