# Deploy Philadelphia Parcels Map to DigitalOcean App Platform

## Prerequisites
- ✅ Secure token repository: `alfredcwchen/philadelphia-parcels-map`
- ✅ Token placeholder `__MAPBOX_TOKEN__` in source code
- ✅ Build script `build.sh` ready for token injection
- ✅ Actual Mapbox token: `pk.eyJ1IjoidGVycmFkb3RzIiwiYSI6ImNsMTNzdGljZDAxMzQzZG93ZXR2c3JrNW8ifQ.IhYvU1tLSWON5qqcQ4zIcg`

---

## Step 1: Navigate to DigitalOcean App Platform

1. **Go to**: https://cloud.digitalocean.com/apps
2. **Login** to your DigitalOcean account
3. **Click "Create App"** (blue button)

---

## Step 2: Connect GitHub Repository

### Source Configuration
1. **Choose Source**: Select **"GitHub"**
2. **Authorize**: Click "Authorize DigitalOcean" (if first time)
3. **Select Repository**: 
   - Repository: `alfredcwchen/philadelphia-parcels-map`
   - Branch: `main`
   - Source Directory: `/` (root)
4. **Auto Deploy**: ✅ Leave **"Autodeploy code changes"** checked
5. **Click "Next"**

---

## Step 3: Configure Build Settings ⚠️ CRITICAL

### Build Configuration
**These settings MUST be exact:**

- **Component Type**: Should auto-detect as **"Static Site"**
- **Build Command**: `./build.sh` ⚠️ **IMPORTANT - Must include the dot-slash**
- **Output Directory**: `dist` ⚠️ **IMPORTANT - Not root directory**
- **Install Command**: Leave empty

### App Information
- **App Name**: `philadelphia-parcels-map`
- **Region**: Choose closest (e.g., New York, San Francisco)

**Click "Next"**

---

## Step 4: Set Environment Variables 🔒 SECURITY CRITICAL

### Add Mapbox Token (Most Important Step!)

1. **Find Environment Variables Section**
2. **Click "Edit"** next to Environment Variables  
3. **Click "Add Variable"**
4. **Configure the Token**:
   - **Key**: `MAPBOX_TOKEN`
   - **Value**: `pk.eyJ1IjoidGVycmFkb3RzIiwiYSI6ImNsMTNzdGljZDAxMzQzZG93ZXR2c3JrNW8ifQ.IhYvU1tLSWON5qqcQ4zIcg`
   - **Scope**: Select **"Build and Runtime"** 
   - **Type**: ✅ Check **"Encrypt"** (makes it a secret)
5. **Click "Save"**
6. **Click "Next"**

> **⚠️ WITHOUT THIS ENVIRONMENT VARIABLE, THE BUILD WILL FAIL!**

---

## Step 5: Choose Plan

### Plan Selection
1. **Select Plan**: Choose **"Basic"** (Free - $0/month)
2. **Instance Size**: Should show **"Basic"** 
3. **Instance Count**: `1`
4. **Click "Next"**

### Free Plan Benefits:
- ✅ **$0/month** cost
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**
- ✅ **Auto-deploy** from GitHub
- ✅ **Custom domain** support (optional)

---

## Step 6: Review and Deploy

### Final Review Checklist
Verify these settings before deploying:

- ✅ **Repository**: `alfredcwchen/philadelphia-parcels-map`
- ✅ **Branch**: `main`
- ✅ **Build Command**: `./build.sh`  
- ✅ **Output Directory**: `dist`
- ✅ **Environment Variable**: `MAPBOX_TOKEN` (encrypted/secret)
- ✅ **Plan**: Basic (Free)

**Click "Create Resources"**

---

## Step 7: Monitor Deployment Process

### Build Phase (2-5 minutes)
**Watch for these SUCCESS messages in build logs:**
```bash
Building with Mapbox token injection...
# ... build process ...
Build completed successfully
Token injected and secured
```

### Deploy Phase
- App gets deployed to global CDN
- You'll get a live URL like: `https://philadelphia-parcels-map-xxxxx.ondigitalocean.app`

### Success Indicators:
- ✅ **Build Status**: "Deployed"
- ✅ **Live URL**: Available and clickable
- ✅ **No error messages** in build logs

---

## Step 8: Verify Deployment & Security

### Functionality Test
1. **Visit your live URL**
2. **Test map features**:
   - Map loads centered on Philadelphia
   - Zoom to level 14+ to see parcels
   - Click on parcels to test popups
   - Verify 400px popup width with 360px tables
   - Test collapsible groups (click headers)
   - Test tooltips on long text

### Security Verification
1. **Check deployed app**:
   - Right-click → "View Source" 
   - Search for `mapboxgl.accessToken`
   - Should see: `mapboxgl.accessToken = 'pk.eyJ1Ijoi...'` (real token)

2. **Check GitHub repo**:
   - Visit: https://github.com/alfredcwchen/philadelphia-parcels-map
   - View `index.html`
   - Should see: `mapboxgl.accessToken = '__MAPBOX_TOKEN__';` (placeholder)

> **✅ SECURITY SUCCESS**: Token is in deployed app but NOT in source code!

---

## Step 9: Custom Domain Setup (Optional)

### If you want a custom domain:
1. **In App Dashboard**: Go to Settings → Domains
2. **Add Domain**: Enter your domain (e.g., `phillymap.yourdomain.com`)
3. **DNS Setup**: Add CNAME record pointing to DigitalOcean's domain
4. **SSL**: Automatic HTTPS certificate will be provisioned

---

## Troubleshooting Common Issues

### Build Fails with Token Error
```
Error: MAPBOX_TOKEN environment variable not set
```
**Solution**: Make sure you added the `MAPBOX_TOKEN` environment variable with correct value

### Build Fails with Script Error
```
./build.sh: Permission denied
```
**Solution**: Verify build command is exactly `./build.sh` with dot-slash

### Map Doesn't Load
**Possible causes**:
- Token not injected (check build logs)
- Wrong token value in environment variables
- Network/firewall blocking Mapbox API

### Popups Don't Work
**Check**:
- Zoom level 14+ (parcels only visible at high zoom)
- WMS service is accessible
- No JavaScript errors in browser console

---

## Post-Deployment Notes

### Auto-Deploy
- Any push to `main` branch triggers automatic redeployment
- Changes take 2-5 minutes to go live
- Build logs available in DigitalOcean dashboard

### Monitoring
- **App Dashboard**: https://cloud.digitalocean.com/apps
- **Build Logs**: Available for each deployment
- **Metrics**: Traffic, performance stats available

### Cost Management
- **Basic plan**: Free forever (with usage limits)
- **Monitor usage**: Check bandwidth and build minutes
- **Upgrade if needed**: More resources available on paid plans

---

## Quick Reference

### Repository
- **GitHub**: https://github.com/alfredcwchen/philadelphia-parcels-map
- **Branch**: main
- **Key Files**: `index.html`, `build.sh`, `README.md`

### DigitalOcean Settings
- **Build Command**: `./build.sh`
- **Output Directory**: `dist`
- **Environment Variable**: `MAPBOX_TOKEN` (encrypted)
- **Plan**: Basic (Free)

### Mapbox Token
```
pk.eyJ1IjoidGVycmFkb3RzIiwiYSI6ImNsMTNzdGljZDAxMzQzZG93ZXR2c3JrNW8ifQ.IhYvU1tLSWON5qqcQ4zIcg
```

---

*This file is local only and will not be committed to GitHub due to .gitignore rules*