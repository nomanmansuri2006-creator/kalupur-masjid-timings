# GitHub Pages Deployment Guide — Kalupur Masjid Timings

This website is designed as a lightweight, zero-build Progressive Web App (PWA) with pure HTML5, CSS3, and ES modules. It can be hosted **100% free forever** on GitHub Pages or Cloudflare Pages.

---

## Deploying to GitHub Pages in 4 Easy Steps

### Step 1: Initialize Git and Commit

Open PowerShell in the project directory:

```powershell
# Navigate to project folder if not already there
cd "c:\Users\NOMAN MANSURI\OneDrive\Desktop\Masjid Timing"

# Initialize repository
git init

# Add all project files
git add .

# Create initial commit
git commit -m "Initial commit: Kalupur Masjid Timings trial website"
```

---

### Step 2: Create a New GitHub Repository

1. Open your browser and go to [https://github.com/new](https://github.com/new).
2. Set the repository name, for example: `kalupur-masjid-timings`.
3. Choose **Public** (required for free GitHub Pages on personal accounts) or **Private** (if you have GitHub Pro).
4. Do NOT check "Initialize this repository with a README".
5. Click **Create repository**.

---

### Step 3: Push Code to GitHub

Copy the remote URL from your newly created repository and push:

```powershell
# Rename default branch to main
git branch -M main

# Add your GitHub remote URL
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/kalupur-masjid-timings.git

# Push code to GitHub
git push -u origin main
```

---

### Step 4: Enable GitHub Pages

1. In your GitHub repository, click on the **Settings** tab.
2. In the left sidebar, click **Pages** (under "Code and automation").
3. Under **Build and deployment**:
   - **Source:** Select `Deploy from a branch`.
   - **Branch:** Select `main` and folder `/ (root)`.
4. Click **Save**.
5. Wait about 60 seconds. Refresh the page to see your live published URL:
   > 🌐 **Live Website URL:** `https://<YOUR_GITHUB_USERNAME>.github.io/kalupur-masjid-timings/`

---

## Why Hash-Based Routing is Used

Single Page Applications (SPAs) on static web hosts often suffer from `404 Not Found` errors when refreshing subpages (e.g., `/masjid/123`).

This project uses hash-based routing (`#home`, `#masjid?id=...`, `#imam`, `#admin`), which:
- Works seamlessly on GitHub Pages without requiring server-side rewrite rules.
- Supports browser back/forward buttons naturally.
- Loads subpages directly on mobile devices without any 404 errors.

---

## Installing on Android (PWA)

1. Open the published GitHub Pages URL on an Android device using Google Chrome.
2. Tap the three dots menu &rarr; **Add to Home screen** (or tap the install prompt banner).
3. The app will be installed with its custom mosque icon and will open fullscreen like a native Android application.
