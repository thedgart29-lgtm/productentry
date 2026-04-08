const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const waitOn = require("wait-on");

let mainWindow;
let nextProcess;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  const nextUrl = "http://localhost:3000";

  if (app.isPackaged) {
    // Determine user data directory for database
    const userDataPath = path.join(app.getPath("userData"), "Database");

    // In production, we run the standalone Next.js server
    const serverScript = path.join(__dirname, "../out/server.js");
    console.log(`Starting Next.js server from: ${serverScript}`);

    nextProcess = spawn("node", [serverScript], {
      env: {
        ...process.env,
        PORT: "3000",
        NODE_ENV: "production",
        DB_DIR: userDataPath, 
      },
    });

    nextProcess.stdout.on("data", (data) => {
      console.log(`[Next.js Server]: ${data}`);
    });

    nextProcess.stderr.on("data", (data) => {
      console.error(`[Next.js Server Error]: ${data}`);
    });

    // Wait until the server is ready
    try {
      await waitOn({
        resources: [nextUrl],
        timeout: 30000,
      });
      mainWindow.loadURL(nextUrl);
    } catch (err) {
      console.error("Next.js server failed to start", err);
      // Fallback or error handling
    }
  } else {
    // In development, Next.js is started in a separate process via `npm run electron:dev`
    mainWindow.loadURL(nextUrl);
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  // Gracefully kill the Next.js process when Electron app closes
  if (nextProcess) {
    nextProcess.kill();
  }
});
