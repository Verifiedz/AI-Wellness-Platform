# AI Wellness Platform

A full-stack wellness application for students, featuring authentication, journaling, AI chat, and push notifications. Built with .NET backend services, React Native (Expo) mobile app, and Docker for easy deployment.

---

## Table of Contents

1. [First-Time Setup (Start Here)](#first-time-setup-start-here)
2. [Prerequisites](#prerequisites)
3. [Step 1: Install Required Software](#step-1-install-required-software)
4. [Step 2: Clone the Repository](#step-2-clone-the-repository)
5. [Step 3: Create the Backend Environment File](#step-3-create-the-backend-environment-file)
6. [Step 4: Start the Backend Services](#step-4-start-the-backend-services)
7. [Step 5: Set Up the Mobile App](#step-5-set-up-the-mobile-app)
8. [Step 6: Run the App](#step-6-run-the-app)
9. [Verifying Everything Works](#verifying-everything-works)
10. [Troubleshooting](#troubleshooting)
11. [Project Structure](#project-structure)

---

## First-Time Setup (Start Here)

This guide walks you through setting up the AI Wellness Platform from scratch. **No prior coding experience is required**—just follow each step in order. If something doesn't work, check the [Troubleshooting](#troubleshooting) section at the bottom.

**What you'll need:**

- A computer (Windows, Mac, or Linux)
- An internet connection
- About 30–45 minutes for the full setup
- A smartphone (optional, for testing the app on a real device)

---

## Prerequisites

Before you begin, you need these tools installed on your computer:


| Tool                    | What It Does                                              | Required For      |
| ----------------------- | --------------------------------------------------------- | ----------------- |
| **Git**                 | Downloads and manages the project code                    | Everyone          |
| **Docker Desktop**      | Runs the backend services (databases, APIs) in containers | Backend           |
| **Node.js**             | Runs the JavaScript tools needed for the mobile app       | Frontend          |
| **Expo Go** (phone app) | Lets you run the app on your phone during development     | Testing on device |


---

## Step 1: Install Required Software

### 1.1 Install Git

**Windows:**

1. Go to [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download and run the installer
3. Accept the default options (click "Next" through the wizard)
4. **Verify:** Open Command Prompt or PowerShell and type `git --version`. You should see something like `git version 2.x.x`

**Mac:**

1. Open Terminal (search "Terminal" in Spotlight)
2. Type: `xcode-select --install` and press Enter (if prompted, click "Install")
3. Or download from [https://git-scm.com/download/mac](https://git-scm.com/download/mac)
4. **Verify:** Type `git --version` in Terminal

### 1.2 Install Docker Desktop

**Windows & Mac:**

1. Go to [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Download Docker Desktop for your operating system
3. Run the installer and follow the prompts
4. **Restart your computer** if prompted
5. **Verify:** Open a terminal and type `docker --version`. You should see a version number. Then type `docker compose version`—you should see "Docker Compose" with a version.

> **Important:** Docker must be **running** before you start the backend. Look for the Docker whale icon in your system tray (Windows) or menu bar (Mac). If it's not running, double-click the Docker Desktop icon to start it.

### 1.3 Install Node.js

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** (Long Term Support) version—the green button
3. Run the installer and accept the defaults
4. **Verify:** Open a new terminal window and type `node --version`. You should see something like `v20.x.x` or `v18.x.x`. Also type `npm --version`—you should see a number like `10.x.x`

---

## Step 2: Clone the Repository

"Cloning" means downloading a copy of the project to your computer.

1. Open a terminal (Command Prompt, PowerShell, or Terminal app)
2. Navigate to where you want the project. For example:
  - **Windows:** `cd C:\Users\YourName\Projects`
  - **Mac/Linux:** `cd ~/Projects` (create the folder if it doesn't exist: `mkdir -p ~/Projects`)
3. Clone the repository (replace the URL with your actual GitHub repo URL):
  ```bash
   git clone https://github.com/YOUR-USERNAME/AI-Wellness-Platform.git
  ```
4. Move into the project folder:
  ```bash
   cd AI-Wellness-Platform
  ```

---

## Step 3: Create the Backend Environment File

The backend needs a configuration file with passwords and API keys. This file is **not** included in the repository for security reasons, so you must create it yourself.

### 3.1 Create the `.env` file

**Option A (easiest):** If the project includes a file named `.env.example`, you can copy it:

- **Windows:** `copy .env.example .env`
- **Mac/Linux:** `cp .env.example .env`
- Then open `.env` and replace `sk-your-openai-api-key-here` with your actual OpenAI API key (if you have one).

**Option B (manual):** Create the file from scratch:

1. In the `AI-Wellness-Platform` folder (the main project root), create a new file named exactly: `.env`
2. Open it in a text editor (Notepad, VS Code, or any editor—**not** Word)
3. Copy and paste the following content into the file:

```env
# =============================================================================
# Docker Compose Environment Variables
# =============================================================================

# --- Database Passwords ---
AUTH_DB_PASSWORD=AuthDbPass2026!
NOTIFICATION_DB_PASSWORD=NotifDbPass2026!
CHAT_DB_USER=postgres
CHAT_DB_PASSWORD=ChatDbPass2026!
REDIS_PASSWORD=RedisPass2026!
JOURNAL_DB_PASSWORD=JournalDbPass2026!

# --- JWT Signing Key (min 32 characters) ---
JWT_KEY=W3llne$$App_Sup3rS3cretJWT_K3y!2026

# --- Internal API keys (shared between services) ---
NOTIFICATION_INTERNAL_API_KEY=notify-internal-secret-key-2026
JOURNAL_INTERNAL_API_KEY=journal-internal-secret-key-2026
AI_INTERNAL_API_KEY=ai-wrapper-secret-key-2026

# --- AI Wrapper (OpenAI or compatible API) ---
# Replace with your own API key from https://platform.openai.com/api-keys
OPENAI_BASE_URL=https://api.openai.com/v1/
OPENAI_API_KEY=sk-your-openai-api-key-here
```

1. **If you have an OpenAI API key:** Replace `sk-your-openai-api-key-here` with your actual key. The AI chat feature won't work without a valid key. You can get one at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) (requires an OpenAI account).
2. **Save the file** in the `AI-Wellness-Platform` folder (same folder as `docker-compose.yml`).

> **Tip for Windows:** If you can't create a file starting with a dot, try:
>
> - Open Notepad, paste the content, then use "Save As" and type `.env` in the filename (with quotes: `".env"`) so it saves correctly.
> - Or use VS Code: right-click the folder → New File → name it `.env`.

---

## Step 4: Start the Backend Services

The backend runs several services (databases, APIs) inside Docker. This step starts them all.

1. Make sure **Docker Desktop is running** (you should see the whale icon).
2. Open a terminal and navigate to the project:
  ```bash
   cd AI-Wellness-Platform
  ```
3. Run:
  ```bash
   docker compose up -d
  ```
4. The first time may take 5–10 minutes as Docker downloads images and builds the services. You'll see lots of output—that's normal.
5. When it finishes, you should see something like "Started" or container names listed. No red error messages means success.

**What's running now:**

- **Auth / API Gateway:** `http://localhost:5051` (this is what the app connects to)
- Chat service, notification service, journal service, and databases are all running in the background.

**To check status:** Run `docker compose ps` — you should see several containers with status "Up".

---

## Step 5: Set Up the Mobile App

The mobile app is built with React Native and Expo. You need to install its dependencies and configure where to find the backend.

### 5.1 Install dependencies

1. Open a terminal and navigate to the frontend folder:
  ```bash
   cd AI-Wellness-Platform/frontend
  ```
2. Run:
  ```bash
   npm install
  ```
3. Wait for it to finish (may take 2–5 minutes). When done, you'll see the command prompt again.

### 5.2 Create the frontend `.env` file

The app needs to know the address of your backend. This depends on **how** you'll run the app:

**Option A: Testing on your phone (recommended for push notifications)**

You must use your computer's **local IP address**, not `localhost`, because your phone is a separate device.

1. **Find your IP address:**
  - **Windows:** Open Command Prompt and run `ipconfig`. Look for "IPv4 Address" under your active connection (Wi-Fi or Ethernet). It will look like `192.168.1.42` or `10.0.0.151`.
  - **Mac:** Open Terminal and run `ipconfig getifaddr en0` (Wi-Fi) or `ipconfig getifaddr en1` (Ethernet). Or go to System Preferences → Network → your connection → Advanced → TCP/IP.
2. Create a file named `.env` in the `frontend` folder with this content (replace `YOUR_IP_ADDRESS` with your actual IP):
  ```env
   EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:5051
   EXPO_PUBLIC_DEV_MODE=true
  ```
   Example: `EXPO_PUBLIC_API_URL=http://192.168.1.42:5051`

**Option B: Testing on an emulator (Android) or simulator (iOS)**

If you're using an emulator on the same computer, you can use:

```env
EXPO_PUBLIC_API_URL=http://localhost:5051
EXPO_PUBLIC_DEV_MODE=true
```

> **Important:** Your phone and computer must be on the **same Wi-Fi network** for Option A to work.

---

## Step 6: Run the App

1. Make sure the backend is still running (`docker compose ps` in the project root—all containers should be "Up").
2. In a terminal, go to the frontend folder:
  ```bash
   cd AI-Wellness-Platform/frontend
  ```
3. Start the Expo development server:
  ```bash
   npx expo start
  ```
4. A QR code will appear in the terminal, and a browser window may open.
5. **On your phone:**
  - Install **Expo Go** from the App Store (iOS) or Google Play (Android)
  - Open Expo Go and scan the QR code from the terminal
  - The app will load on your phone
6. **On an emulator:** Press `a` for Android emulator or `i` for iOS simulator (if you have them installed).

**To log in:** On the login screen, enter any User ID (e.g. `user-1`) and optionally an email. This is a placeholder—real authentication will be added later.

---

## Verifying Everything Works


| Check                | How to Verify                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Backend is running   | `docker compose ps` shows all containers as "Up"                                                                                 |
| Gateway is reachable | Open a browser and go to `http://localhost:5051` — you may see a 404 or auth error; that's OK, it means the server is responding |
| App loads            | The app opens on your phone/emulator and shows the login screen                                                                  |
| Login works          | Enter `user-1` and tap Login — you should see the main app with tabs (Home, Journal, AI Chat, Settings)                          |
| API connection       | After login, go to Home — if "Tip of the Day" loads (or shows a message), the app is talking to the backend                      |


---

## Troubleshooting

### "docker compose: command not found" or "docker: command not found"

- Docker Desktop is not installed or not in your PATH. Reinstall Docker Desktop and restart your computer.
- On older Docker installations, try `docker-compose` (with a hyphen) instead of `docker compose`.

### "Cannot connect to the Docker daemon"

- Docker Desktop is not running. Start it from your applications and wait until the whale icon appears and is steady.

### "The system cannot find the file specified" when running docker compose

- You're not in the correct folder. Run `cd AI-Wellness-Platform` first (adjust the path if your project is elsewhere).
- The `.env` file is missing. Make sure it exists in the same folder as `docker-compose.yml`.

### App shows "Network request failed" or "Unable to connect"

- **If on a phone:** Check that `EXPO_PUBLIC_API_URL` uses your computer's IP (e.g. `http://192.168.1.42:5051`), not `localhost`.
- **If on a phone:** Ensure your phone and computer are on the same Wi-Fi network.
- **Firewall:** Your computer's firewall may be blocking port 5051. Try temporarily disabling it or adding an exception for Node/Expo.
- **Backend not running:** Run `docker compose ps` and ensure all containers are Up.

### "npm install" fails or gives errors

- Make sure Node.js is installed: `node --version` should show v18 or higher.
- Try deleting the `node_modules` folder and `package-lock.json` in the frontend folder, then run `npm install` again.
- On Windows, try running the terminal as Administrator.

### QR code doesn't work when scanning with Expo Go

- Ensure your phone and computer are on the same Wi-Fi.
- Try the "Tunnel" option: when Expo starts, press `s` to switch connection type, then choose "tunnel" (slower but works across different networks).

### Push notifications don't work

- Push notifications only work on a **physical device**, not on emulators or simulators.
- You need to build a development client (`npx expo run:android` or `npx expo run:ios`) for full push support with Expo Go. See the [frontend README](frontend/README.md) for details.

### Port already in use

- Another program is using port 5051, 5050, or another port. Stop other services using those ports, or change the port mapping in `docker-compose.yml` (advanced).

### Need to stop everything

- To stop the backend: `docker compose down` (run from the `AI-Wellness-Platform` folder)
- To stop the app: Press `Ctrl+C` in the terminal where `npx expo start` is running

---

## Project Structure

```
AI-Wellness-Platform/
├── auth-service/          # Authentication & API gateway (YARP)
├── notification-service/  # Push notifications, daily tips
├── chat-service/          # AI chat
├── journal-service/       # Journal entries
├── AI-Wrapper-Service/    # AI/LLM integration
├── frontend/              # React Native (Expo) mobile app
├── docker-compose.yml     # Orchestrates all backend services
├── .env                   # Environment config (you create this)
└── README.md              # This file
```

For more details on the frontend (navigation, notification feature, API contract), see [frontend/README.md](frontend/README.md).

---

## Quick Reference Commands


| Task                 | Command                                    |
| -------------------- | ------------------------------------------ |
| Start backend        | `docker compose up -d` (from project root) |
| Stop backend         | `docker compose down`                      |
| Check backend status | `docker compose ps`                        |
| Start mobile app     | `cd frontend` then `npx expo start`        |
| View backend logs    | `docker compose logs -f`                   |


---

**Need help?** Ask your team lead or check the troubleshooting section above. Happy coding!