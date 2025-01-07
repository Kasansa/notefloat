const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { screen } = require('electron');
let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: screen.getPrimaryDisplay().bounds.width,
    height: screen.getPrimaryDisplay().bounds.height,
    transparent: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundColor: "#00000000",
  });

  // Set window to always be on top
  mainWindow.setAlwaysOnTop(true, 'floating');

  // Set default click-through behavior
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Handle click-through toggling from the renderer
  ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  });

  mainWindow.on("will-move", (event, newBounds) => {
    const { x, y } = newBounds;
    const { width, height } = screen.getPrimaryDisplay().bounds;
  
    if (x < 0 || y < 0 || x + newBounds.width > width || y + newBounds.height > height) {
      event.preventDefault();
    }
  });

  mainWindow.loadURL("http://localhost:5173");
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});