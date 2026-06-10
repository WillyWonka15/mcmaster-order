# McMaster Order Tool — Cloud Setup

## File Structure
```
mcmaster-cloud/
  server.py          # Flask app
  requirements.txt   # Python dependencies
  Procfile           # Render start command
  static/
    index.html       # Web UI
  extension/
    manifest.json    # Chrome extension config
    background.js    # Fills McMaster order page
    content.js       # Listens for order data
```

---

## Part 1 — Deploy to Render

### 1. Push to GitHub
Create a new GitHub repo (e.g. `mcmaster-order`), then push this folder:
```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USERNAME/mcmaster-order.git
git push -u origin main
```

### 2. Add Google credentials to Render
On Render you can't upload files, so credentials go in as an environment variable:
- Open your `credentials.json`
- Copy the entire contents
- In Render dashboard → your service → **Environment** → add variable:
  - Key: `GOOGLE_CREDENTIALS`
  - Value: paste the entire JSON

### 3. Create Render service
1. Go to render.com → **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn server:app`
   - **Plan:** Free
4. Hit **Deploy**

Render gives you a URL like `https://mcmaster-order.onrender.com`

---

## Part 2 — Install Chrome Extension

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Done — the extension is installed

Only needs to be installed once per computer that places orders.

---

## Usage

1. Anyone opens `https://your-app.onrender.com`
2. Enters DV numbers + quantities
3. Hits **Look Up Parts** — resolves against Google Sheet
4. Reviews the summary
5. Hits **Send to McMaster →**
6. Extension opens McMaster orders page and auto-fills all parts
7. Person with McMaster login reviews and checks out

---

## Updating the Parts Sheet
Just edit the Google Sheet — the app reads it live on every lookup.
