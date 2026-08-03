# WISP frontend (Vite + React)

This is a real, runnable React project — not the Claude.ai artifact preview.
It needs a real hosting step because `socket.io-client` (needed to talk to
your backend) isn't something the in-chat preview supports.

## No-computer deployment path (phone browser only)

You don't need a computer, terminal, or npm installed anywhere. Everything
below happens through GitHub's, Render's, and Vercel's own websites.

### 1. Deploy the backend first (Render)

1. Go to **github.com** on your phone, sign up/log in.
2. Tap **+ → New repository** → name it `wisp-backend` → Create.
3. On the new repo page, tap **Add file → Upload files**, and upload every
   file/folder from the `wisp-backend` project (the zip Claude gave you —
   unzip it first, most phone file managers can do this, or use an app like
   "Files" on iOS / your file manager's built-in unzip on Android).
4. Commit the upload.
5. Go to **render.com**, sign up with your GitHub account.
6. Tap **New → Web Service**, pick the `wisp-backend` repo.
7. Build command: `npm install`. Start command: `npm start`.
8. Under **Environment**, add the variables from `.env.example`
   (at minimum set `ALLOWED_ORIGINS` — you'll update this in step 4 below
   once you know your frontend's URL).
9. Deploy. Render gives you a live URL like `https://wisp-backend.onrender.com`
   — copy it.

### 2. Update this frontend with your backend's real URL

Still in GitHub (browser), open your `wisp-frontend` repo (create it the same
way as step 1, upload this whole `wisp-frontend` folder), open
`src/App.jsx`, tap the **pencil (edit) icon**, find this line near the top:

```js
const BACKEND_URL = "https://your-backend-url.example.com";
```

Replace it with your real Render URL, then **Commit changes** directly in
GitHub's browser editor. No re-upload needed.

### 3. Deploy the frontend (Vercel)

1. Go to **vercel.com**, sign up with your GitHub account.
2. Tap **Add New → Project**, pick the `wisp-frontend` repo.
3. Vercel auto-detects Vite — leave the defaults, tap **Deploy**.
4. You'll get a live URL like `https://wisp-frontend.vercel.app` — that's
   your actual live website, reachable from any phone/computer.

### 4. Close the loop

Go back to Render (your backend), update `ALLOWED_ORIGINS` to your real
Vercel URL, and redeploy (Render does this automatically when you save env
vars). Now the two are talking to each other for real.

### 5. Test it

Open your Vercel URL on two different phones (or your phone + a friend's),
go through onboarding on both, and you should get matched with each other —
a real connection, not a simulation.

## If you'd rather preview/edit live in a browser first

Open **stackblitz.com**, sign in with GitHub, and go to
`stackblitz.com/github/YOUR_USERNAME/wisp-frontend` — it opens this whole
project in an in-browser dev environment (real npm install, real dev server,
all in a mobile-friendly web IDE) before you even deploy to Vercel.
