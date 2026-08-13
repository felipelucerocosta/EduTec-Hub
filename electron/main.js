// ============================================================
// EduTechHub — Electron Main Process
// ============================================================
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const IS_DEV = !app.isPackaged;
const BACKEND_PORT = 3001;

let mainWindow = null;
let backendProcess = null;

// ─── Rutas según entorno ─────────────────────────────────────
function getResourcePath(...segments) {
  if (IS_DEV) {
    return path.join(__dirname, '..', ...segments);
  }
  // En producción, extraResources va a process.resourcesPath/app/
  return path.join(process.resourcesPath, 'app', ...segments);
}

// ─── Iniciar el servidor Express ─────────────────────────────
function startBackend() {
  return new Promise((resolve) => {
    const backendDir = getResourcePath('backend');
    const serverScript = path.join(backendDir, 'server.js');
    const envFile = path.join(backendDir, '.env');

    // En dev usamos ts-node, en producción node sobre el JS compilado
    let cmd, args;
    if (IS_DEV) {
      cmd = 'node';
      args = [
        path.join(__dirname, '..', 'node_modules', '.bin', 'ts-node-dev'),
        '--respawn', '--transpile-only',
        path.join(__dirname, '..', 'backend', 'server.ts'),
      ];
    } else {
      cmd = process.execPath; // El Node bundled por Electron
      args = [serverScript];
    }

    const dbPath = getResourcePath('database');

    backendProcess = spawn(cmd, args, {
      cwd: IS_DEV ? path.join(__dirname, '..') : backendDir,
      env: {
        ...process.env,
        NODE_ENV: IS_DEV ? 'development' : 'production',
        PORT: String(BACKEND_PORT),
        // Apuntar la BD al directorio correcto
        DB_PATH: path.join(dbPath, 'edutechhub.sql'),
        // Cargar .env del backend si existe
        DOTENV_CONFIG_PATH: fs.existsSync(envFile) ? envFile : undefined,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    backendProcess.stdout?.on('data', (data) => {
      const msg = data.toString().trim();
      console.log('[backend]', msg);
      if (msg.includes('corriendo en') || msg.includes('listening')) {
        resolve();
      }
    });

    backendProcess.stderr?.on('data', (data) => {
      console.error('[backend-err]', data.toString().trim());
    });

    backendProcess.on('error', (err) => {
      console.error('[backend] spawn error:', err);
      resolve(); // Continuar de todas formas
    });

    // Máximo 10 segundos de espera
    setTimeout(resolve, 10000);
  });
}

// ─── Esperar que el puerto esté disponible ─────────────────────
function waitForPort(port, maxRetries = 30) {
  return new Promise((resolve) => {
    let retries = 0;
    const attempt = () => {
      const req = http.get(`http://localhost:${port}/`, () => resolve(true));
      req.on('error', () => {
        if (retries++ < maxRetries) {
          setTimeout(attempt, 400);
        } else {
          resolve(false); // Timeout, continuar igual
        }
      });
      req.setTimeout(500, () => req.destroy());
    };
    attempt();
  });
}

// ─── Crear ventana principal ──────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'EduTechHub',
    backgroundColor: '#0d0927',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // Links externos → navegador del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const url = `http://localhost:${BACKEND_PORT}`;
  console.log(`[electron] Cargando: ${url}`);
  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (IS_DEV) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── Ciclo de vida Electron ───────────────────────────────────
app.whenReady().then(async () => {
  console.log(`[electron] Iniciando EduTechHub (${IS_DEV ? 'dev' : 'producción'})...`);

  try {
    await startBackend();
    const ready = await waitForPort(BACKEND_PORT);
    if (!ready) console.warn('[electron] Backend tardó demasiado, abriendo igualmente...');
    await createWindow();
  } catch (err) {
    console.error('[electron] Error crítico al iniciar:', err);
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
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
