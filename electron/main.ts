import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { app, BrowserWindow, Menu, nativeImage } from 'electron';
import { registerApiRoutes } from '../src/server/app.ts';

let mainWindow: BrowserWindow | null = null;
let localServer: http.Server | null = null;

function resolveAppIcon() {
  const candidates = [
    path.join(process.resourcesPath ?? '', 'build', 'icon.ico'),
    path.join(process.resourcesPath ?? '', 'build', 'icon.png'),
    path.resolve(__dirname, '../build/icon.ico'),
    path.resolve(__dirname, '../build/icon.png'),
    path.resolve(process.cwd(), 'build/icon.ico'),
    path.resolve(process.cwd(), 'build/icon.png'),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      const image = nativeImage.createFromPath(candidate);
      if (!image.isEmpty()) {
        return image;
      }
    }
  }
  return undefined;
}

function resolveDistDir(): string {
  const candidates = [
    path.resolve(__dirname, '../dist'),
    path.resolve(app.getAppPath(), 'dist'),
    path.resolve(process.cwd(), 'dist'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }
  return candidates[0];
}

function startEmbeddedServer(): Promise<{ port: number; origin: string }> {
  return new Promise((resolve, reject) => {
    const expressApp = express();
    const dataFilePath = path.join(app.getPath('userData'), 'immoluxe-data.json');

    registerApiRoutes(expressApp, { dataFilePath });

    const distPath = resolveDistDir();
    expressApp.use(express.static(distPath));
    expressApp.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Interface ImmoLuxe introuvable.');
      }
    });

    const server = expressApp.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Impossible de démarrer le serveur local ImmoLuxe.'));
        return;
      }
      localServer = server;
      resolve({
        port: address.port,
        origin: `http://127.0.0.1:${address.port}`,
      });
    });

    server.on('error', reject);
  });
}

async function createDesktopWindow(): Promise<void> {
  const { origin } = await startEmbeddedServer();
  const targetUrl = process.env.IMMO_ELECTRON_DEV_URL?.trim() || origin;
  const allowedOrigin = new URL(targetUrl).origin;

  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'ImmoLuxe — Pilotage Immobilier de Prestige',
    backgroundColor: '#F8FAFC',
    icon: resolveAppIcon(),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  });

  mainWindow = win;

  // Keep navigation strictly inside the standalone desktop app (no external browser popups)
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsed = new URL(navigationUrl);
      if (parsed.origin !== allowedOrigin) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    mainWindow = null;
  });

  await win.loadURL(targetUrl);
}

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
} else {
  app.setAppUserModelId('com.immoluxe.desktop');

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    void createDesktopWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createDesktopWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('will-quit', () => {
    if (localServer) {
      localServer.close();
      localServer = null;
    }
  });
}
