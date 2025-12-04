# Deployment Guide - 2v2 Kickoff Tracker

Complete guide for deploying the 2v2 Kickoff Tracker application to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Build](#local-build)
3. [Server Setup](#server-setup)
4. [Deployment](#deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL Setup (Optional)](#ssl-setup-optional)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)
9. [Quick Deploy (After Initial Setup)](#quick-deploy-after-initial-setup)

---

## Prerequisites

### Required Access
- SSH access to the server: `ubuntu@57.129.114.213`
- SSH key configured for passwordless access
- sudo privileges on the server

### Required Software (Local)
- Node.js (v18 or higher)
- npm
- Git

### Required Software (Server)
- Nginx
- Certbot (for SSL)

---

## Local Build

### Step 1: Navigate to project directory
```bash
cd /Users/dospro/vibes/TestGit/playground1521/2v2
```

### Step 2: Ensure you're on main branch
```bash
git checkout main
git pull origin main
```

### Step 3: Install dependencies (if needed)
```bash
npm install
```

### Step 4: Build for production
```bash
npm run build
```

**Expected output:**
```
✓ built in X.XXs
dist/index.html
dist/assets/index-[hash].css
dist/assets/index-[hash].js
```

### Step 5: Verify build
```bash
ls -lh dist/
```

You should see:
- `index.html`
- `assets/` folder with CSS and JS files
- Total size: ~500 KB

---

## Server Setup

### Step 1: SSH into the server
```bash
ssh ubuntu@57.129.114.213
```

**If using a specific SSH key:**
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@57.129.114.213
```

### Step 2: Create deployment directory
```bash
sudo mkdir -p /var/www/memsi2.dem101.dev
```

### Step 3: Set ownership
```bash
sudo chown -R ubuntu:ubuntu /var/www/memsi2.dem101.dev
```

### Step 4: Set permissions
```bash
sudo chmod -R 755 /var/www/memsi2.dem101.dev
```

### Step 5: Verify directory exists
```bash
ls -lh /var/www/
```

**Expected output:** You should see `memsi2.dem101.dev/` owned by `ubuntu:ubuntu`

### Step 6: Exit SSH (for now)
```bash
exit
```

---

## Deployment

### Method 1: Using SCP (Recommended)

From your **local terminal** (in the project directory):

```bash
scp -r dist/* ubuntu@57.129.114.213:/var/www/memsi2.dem101.dev/
```

**If using a specific SSH key:**
```bash
scp -i ~/.ssh/your-key.pem -r dist/* ubuntu@57.129.114.213:/var/www/memsi2.dem101.dev/
```

**Expected output:**
```
index.html                  100%  780B
index-[hash].css           100%  19KB
index-[hash].js            100%  466KB
...
```

### Method 2: Using rsync (Alternative)

More efficient for updates (only transfers changed files):

```bash
rsync -avz --delete dist/ ubuntu@57.129.114.213:/var/www/memsi2.dem101.dev/
```

**Flags explained:**
- `-a`: Archive mode (preserves permissions, timestamps)
- `-v`: Verbose (shows progress)
- `-z`: Compress during transfer
- `--delete`: Remove files on server that don't exist locally

### Verify deployment

SSH back into the server:
```bash
ssh ubuntu@57.129.114.213
```

Check deployed files:
```bash
ls -lh /var/www/memsi2.dem101.dev/
```

**Expected:** You should see `index.html` and `assets/` folder

---

## Nginx Configuration

### Step 1: Create nginx config file

Still SSH'd into the server:

```bash
sudo nano /etc/nginx/sites-available/memsi2.dem101.dev
```

### Step 2: Paste this configuration

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name memsi2.dem101.dev;

    root /var/www/memsi2.dem101.dev;
    index index.html;

    # Logging
    access_log /var/log/nginx/memsi2.dem101.dev.access.log;
    error_log /var/log/nginx/memsi2.dem101.dev.error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/javascript application/xml+rss
               application/json application/x-javascript;

    # SPA routing - redirect all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Don't serve hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Enable the site

Create symbolic link:
```bash
sudo ln -s /etc/nginx/sites-available/memsi2.dem101.dev /etc/nginx/sites-enabled/
```

### Step 4: Test nginx configuration

```bash
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**If you see errors:**
- Check for typos in the config file
- Verify the path `/var/www/memsi2.dem101.dev` exists
- Make sure there are no duplicate `server_name` entries

### Step 5: Reload nginx

```bash
sudo systemctl reload nginx
```

### Step 6: Check nginx status

```bash
sudo systemctl status nginx
```

**Expected output:**
```
● nginx.service - A high performance web server
   Active: active (running)
```

Press `q` to exit status view.

### Step 7: Check logs (if needed)

```bash
sudo tail -f /var/log/nginx/memsi2.dem101.dev.error.log
```

Press `Ctrl+C` to stop tailing logs.

---

## SSL Setup (Optional)

### Prerequisites

1. **Domain must point to server:**
   - DNS A record: `memsi2.dem101.dev` → `57.129.114.213`
   - Wait for DNS propagation (can take up to 48 hours, usually 5-10 minutes)

2. **Verify DNS:**
   ```bash
   nslookup memsi2.dem101.dev
   ```
   or
   ```bash
   dig memsi2.dem101.dev
   ```

### Step 1: Install Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Obtain SSL certificate

```bash
sudo certbot --nginx -d memsi2.dem101.dev
```

**Follow the prompts:**
1. Enter email address (for renewal notifications)
2. Agree to Terms of Service: `Y`
3. Share email with EFF (optional): `Y` or `N`
4. Choose: `2` (Redirect HTTP to HTTPS - recommended)

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/memsi2.dem101.dev/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/memsi2.dem101.dev/privkey.pem
```

### Step 3: Test auto-renewal

Certbot sets up automatic renewal. Test it:

```bash
sudo certbot renew --dry-run
```

**Expected output:** `Congratulations, all simulated renewals succeeded`

### Step 4: Verify SSL

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Verification

### Step 1: Check from browser

Open in browser:
- **HTTP:** http://memsi2.dem101.dev
- **HTTPS (if SSL configured):** https://memsi2.dem101.dev

### Step 2: Verify the fix is working

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Sign up a new user** (or sign in)

**Look for these logs:**
```
[AUTH] Loading profile for user: [user-id]
[AUTH] Profile query took Xms        (should be < 1000ms)
[AUTH] Profile loaded successfully
[AUTH] Setting loading to false
```

**On second SIGNED_IN event, you should see:**
```
[AUTH] Profile already loaded for this user, skipping
```

**You should NOT see:**
```
❌ [AUTH] Profile query timed out after 10 seconds
❌ [AUTH] Failed to load profile: Error: Profile query timeout
```

### Step 3: Test functionality

- ✅ Sign up works
- ✅ Sign in works
- ✅ Create session works
- ✅ Join session works
- ✅ Match logging works
- ✅ Groups work
- ✅ Admin panel works (if admin user)

### Step 4: Check network requests

In DevTools → Network tab:
- ✅ No failed requests (status 200)
- ✅ Static assets load quickly
- ✅ No duplicate profile queries

### Step 5: Check loading times

- ✅ Initial page load: < 2 seconds
- ✅ Profile query: < 1 second
- ✅ No infinite loading screens

---

## Troubleshooting

### Issue: "Permission denied" during SCP

**Solution:**
```bash
ssh ubuntu@57.129.114.213
sudo chown -R ubuntu:ubuntu /var/www/memsi2.dem101.dev
exit
```

### Issue: 404 Not Found after deployment

**Possible causes:**
1. Files not deployed correctly
2. Wrong nginx root path
3. Nginx not reloaded

**Solution:**
```bash
# Check files exist
ssh ubuntu@57.129.114.213 "ls -lh /var/www/memsi2.dem101.dev/"

# Check nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Issue: SPA routes return 404

**Cause:** Nginx not configured for SPA routing

**Solution:** Ensure `try_files $uri $uri/ /index.html;` is in nginx config

### Issue: CSS/JS not loading

**Possible causes:**
1. Wrong file paths
2. CORS issues
3. Gzip issues

**Solution:**
```bash
# Check browser DevTools Console for errors
# Check nginx error log
sudo tail -f /var/log/nginx/memsi2.dem101.dev.error.log
```

### Issue: SSL certificate not working

**Possible causes:**
1. DNS not pointing to server
2. Port 80/443 blocked by firewall
3. Certbot failed

**Solution:**
```bash
# Check DNS
nslookup memsi2.dem101.dev

# Check firewall
sudo ufw status

# Allow HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Try obtaining certificate again
sudo certbot --nginx -d memsi2.dem101.dev
```

### Issue: Old version still showing after deployment

**Cause:** Browser cache

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Open in incognito/private window

### Issue: Profile loading timeout still occurring

**Possible causes:**
1. Old build deployed
2. Browser serving cached JS
3. Supabase connection issues

**Solution:**
```bash
# Verify build version
cat dist/index.html  # Check if assets hash changed

# Force rebuild
rm -rf dist/
npm run build

# Redeploy
scp -r dist/* ubuntu@57.129.114.213:/var/www/memsi2.dem101.dev/
```

---

## Quick Deploy (After Initial Setup)

Once server is configured, use this quick process for updates:

### From project root:

```bash
# 1. Pull latest code
git pull origin main

# 2. Build
npm run build

# 3. Deploy
scp -r dist/* ubuntu@57.129.114.213:/var/www/memsi2.dem101.dev/

# 4. Clear browser cache and test
```

### One-liner:
```bash
git pull origin main && npm run build && scp -r dist/* ubuntu@57.129.114.213:/var/www/memsi2.dem101.dev/
```

---

## Deployment Checklist

Before deploying:
- [ ] All code committed to git
- [ ] On `main` branch
- [ ] Code pulled from origin
- [ ] `npm run build` succeeds with no errors
- [ ] Build size is reasonable (~500KB total)

During deployment:
- [ ] Files uploaded successfully via SCP
- [ ] Nginx config tested with `nginx -t`
- [ ] Nginx reloaded
- [ ] No errors in nginx error log

After deployment:
- [ ] Site loads in browser
- [ ] Console shows no errors
- [ ] Profile loads in < 1 second
- [ ] No timeout errors
- [ ] SPA routing works (refresh on any route)
- [ ] All features functional

---

## Server Information

**Server:** 57.129.114.213
**User:** ubuntu
**Deployment Path:** /var/www/memsi2.dem101.dev
**Domain:** memsi2.dem101.dev
**Web Server:** Nginx
**SSL:** Let's Encrypt (Certbot)

**Nginx Config:** `/etc/nginx/sites-available/memsi2.dem101.dev`
**Nginx Enabled:** `/etc/nginx/sites-enabled/memsi2.dem101.dev`
**Access Log:** `/var/log/nginx/memsi2.dem101.dev.access.log`
**Error Log:** `/var/log/nginx/memsi2.dem101.dev.error.log`

---

## Additional Resources

- **Nginx Documentation:** https://nginx.org/en/docs/
- **Certbot Documentation:** https://certbot.eff.org/
- **Let's Encrypt:** https://letsencrypt.org/
- **Vite Build Guide:** https://vitejs.dev/guide/build.html

---

## Notes

- SSL certificates auto-renew via certbot cron job
- Nginx serves static files with 1-year cache for assets
- SPA routing handled by `try_files` directive
- Gzip compression enabled for all text-based files
- Security headers added for basic protection

---

**Last Updated:** December 4, 2025
**Deployment Version:** Post loading-bug-fix (commit 6bfdde4)
