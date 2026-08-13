// ============================================================
// EduTechHub — Electron Main Process
// ============================================================
// Este archivo es el punto de entrada de la aplicación Electron.
// Inicia el servidor Express de backend, espera a que esté listo,
// y luego abre la ventana del navegador apuntando al frontend.
//
// En producción, el frontend se sirve estático desde /dist.
// ============================================================

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// Rutas
const IS_DEV = !app.isPackaged;
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 5173;  // solo en dev; en prod el backend sirve el dist

let mainWindow = null;
let backendProcess = null;

// ─── Iniciar el servidor Express ────────────────────────────
function startBackend() {
  return new Promise((resolve, reject) => {
    const serverScript = IS_DEV
      ? path.join(__dirname, 'backend', 'server.ts')
      : path.join(process.resourcesPath, 'backend', 'server.js');

    const cmd = IS_DEV ? 'npx' : 'node';
    const args = IS_DEV
      ? ['ts-node', '--transpile-only', serverScript]
      : [serverScript];

    backendProcess = spawn(cmd, args, {
      cwd: IS_DEV ? __dirname : process.resourcesPath,
      env: {
        ...process.env,
        NODE_ENV: IS_DEV ? 'development' : 'production',
        PORT: String(BACKEND_PORT),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    backendProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log('[backend]', msg.trim());
      if (msg.includes('corriendo en')) {
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('[backend-err]', data.toString().trim());
    });

    backendProcess.on('error', reject);

    // Timeout por si el servidor no arranca
    setTimeout(() => resolve(), 8000);
  });
}

// ─── Esperar que el puerto esté disponible ──────────────────
function waitForPort(port, retries = 20) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      http.get(`http://localhost:${port}/`, () => resolve())
        .on('error', () => {
          if (n <= 0) return reject(new Error(`Timeout esperando puerto ${port}`));
          setTimeout(() => attempt(n - 1), 500);
        });
    };
    attempt(retries);
  });
}

// ─── Crear ventana principal ─────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'EduTechHub',
    icon: path.join(__dirname, 'frontend', 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#0d0927',
    show: false,
  });

  // Abrir links externos en el navegador del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const url = IS_DEV
    ? `http://localhost:${FRONTEND_PORT}`
    : `http://localhost:${BACKEND_PORT}`;

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (IS_DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── Ciclo de vida Electron ──────────────────────────────────
app.whenReady().then(async () => {
  try {
    console.log('🚀 Iniciando backend Express...');
    await startBackend();
    await waitForPort(BACKEND_PORT);
    console.log(`✅ Backend listo en http://localhost:${BACKEND_PORT}`);
    await createWindow();
  } catch (err) {
    console.error('❌ Error al iniciar EduTechHub:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
