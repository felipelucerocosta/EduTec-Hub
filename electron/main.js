// ============================================================
// EduTechHub — Electron Main Process
// ============================================================
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');

const IS_DEV = !app.isPackaged;
const BACKEND_PORT = 3001;

let mainWindow = null;
let backendProcess = null;

// ─── Logging persistente para diagnóstico ─────────────────────
function log(...args) {
  const msg = `[${new Date().toISOString()}] ${args.join(' ')}`;
  console.log(msg);

  try {
    if (app.isReady()) {
      const logDir = path.join(app.getPath('userData'), 'logs');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logFile = path.join(logDir, 'edutechhub.log');
      fs.appendFileSync(logFile, msg + '\n');
    }
  } catch (e) {
    // Ignorar fallos de escritura de log
  }
}

// ─── Rutas según entorno ─────────────────────────────────────
function getResourcePath(...segments) {
  if (IS_DEV) {
    return path.join(__dirname, '..', ...segments);
  }
  // En producción, extraResources se ubican en process.resourcesPath/
  return path.join(process.resourcesPath, ...segments);
}

// ─── Matar proceso en puerto o por PID (evitar zombis) ────────
function killPortOrProcess(pid) {
  if (pid) {
    log(`[electron] Terminando proceso PID ${pid}...`);
    if (process.platform === 'win32') {
      try {
        execSync(`taskkill /PID ${pid} /F /T 2>nul`, { stdio: 'ignore' });
      } catch (e) {}
    } else {
      try { process.kill(pid, 'SIGKILL'); } catch (e) {}
    }
  }
}

// ─── Limpiar puerto antes de iniciar ─────────────────────────
function freePortIfOccupied(port) {
  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            log(`[electron] Puerto ${port} ocupado por PID ${pid}. Liberando...`);
            execSync(`taskkill /PID ${pid} /F /T 2>nul`, { stdio: 'ignore' });
          }
        }
      }
    } catch (e) {
      // Puerto no ocupado o comando sin coincidencias
    }
  }
}

// ─── Preparar persistencia en userData ───────────────────────
function setupUserDataStorage() {
  const userData = app.getPath('userData');
  const userDbDir = path.join(userData, 'database');
  const userDbPath = path.join(userDbDir, 'edutechhub.sql');
  const userUploadsDir = path.join(userData, 'uploads');

  if (!fs.existsSync(userDbDir)) fs.mkdirSync(userDbDir, { recursive: true });
  if (!fs.existsSync(userUploadsDir)) fs.mkdirSync(userUploadsDir, { recursive: true });

  // Si la BD de usuario no existe aún, copiar la plantilla incluida en el paquete
  if (!fs.existsSync(userDbPath)) {
    const templateDbPath = getResourcePath('database', 'edutechhub.sql');
    if (fs.existsSync(templateDbPath)) {
      log(`[electron] Copiando BD inicial desde ${templateDbPath} a ${userDbPath}`);
      fs.copyFileSync(templateDbPath, userDbPath);
    } else {
      log(`[electron] ⚠️ No se encontró plantilla de BD en ${templateDbPath}`);
    }
  }

  return { userDbPath, userUploadsDir };
}

// ─── Iniciar el servidor Express / Backend ───────────────────
function startBackend() {
  return new Promise((resolve) => {
    // 1. Asegurar que el puerto esté libre
    if (!IS_DEV) {
      freePortIfOccupied(BACKEND_PORT);
    }

    const backendDir = getResourcePath('backend');
    const serverScript = path.join(backendDir, 'server.js');
    const envFile = path.join(backendDir, '.env');

    log('[backend] backendDir:', backendDir);
    log('[backend] serverScript:', serverScript);
    log('[backend] serverScript exists:', fs.existsSync(serverScript));

    let cmd, args, extraEnv = {};
    let dbFilePath, uploadsDirPath;

    if (IS_DEV) {
      cmd = 'node';
      args = [
        path.join(__dirname, '..', 'node_modules', '.bin', 'ts-node-dev'),
        '--respawn', '--transpile-only',
        path.join(__dirname, '..', 'backend', 'server.ts'),
      ];
      dbFilePath = path.join(__dirname, '..', 'database', 'edutechhub.sql');
      uploadsDirPath = path.join(__dirname, '..', 'uploads');
    } else {
      // En producción, usamos el binario Electron como motor Node.js puro
      cmd = process.execPath;
      args = [serverScript];
      extraEnv.ELECTRON_RUN_AS_NODE = '1';

      const storage = setupUserDataStorage();
      dbFilePath = storage.userDbPath;
      uploadsDirPath = storage.userUploadsDir;
    }

    log('[backend] dbFilePath:', dbFilePath);
    log('[backend] uploadsDirPath:', uploadsDirPath);

    backendProcess = spawn(cmd, args, {
      cwd: IS_DEV ? path.join(__dirname, '..') : backendDir,
      env: {
        ...process.env,
        ...extraEnv,
        NODE_ENV: IS_DEV ? 'development' : 'production',
        PORT: String(BACKEND_PORT),
        DB_PATH: dbFilePath,
        UPLOADS_PATH: uploadsDirPath,
        DOTENV_CONFIG_PATH: fs.existsSync(envFile) ? envFile : undefined,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    backendProcess.stdout?.on('data', (data) => {
      const msg = data.toString().trim();
      log('[backend]', msg);
      if (msg.includes('corriendo en') || msg.includes('listening')) {
        resolve();
      }
    });

    backendProcess.stderr?.on('data', (data) => {
      log('[backend-err]', data.toString().trim());
    });

    backendProcess.on('error', (err) => {
      log('[backend] spawn error:', err.message);
      resolve();
    });

    backendProcess.on('exit', (code, signal) => {
      log('[backend] process exited with code:', code, 'signal:', signal);
    });

    // Máximo 15 segundos de espera
    setTimeout(resolve, 15000);
  });
}

// ─── Esperar que el puerto esté disponible ─────────────────────
function waitForPort(port, maxRetries = 30) {
  return new Promise((resolve) => {
    let retries = 0;
    const attempt = () => {
      const req = http.get(`http://localhost:${port}/api/whoami`, (res) => {
        // Si responde cualquier código HTTP (200, 401, etc.), el backend Express está vivo
        resolve(true);
      });
      req.on('error', () => {
        if (retries++ < maxRetries) {
          setTimeout(attempt, 400);
        } else {
          resolve(false);
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

  // Enlaces externos -> abrir en navegador predeterminado
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Monitoreo de errores en renderer
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc, validatedURL) => {
    log('[electron] did-fail-load:', errorCode, errorDesc, validatedURL);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    log(`[renderer-${levels[level] || level}]`, message);
  });

  const url = `http://localhost:${BACKEND_PORT}`;
  log(`[electron] Cargando aplicación desde: ${url}`);

  try {
    await mainWindow.loadURL(url);
    log('[electron] URL cargada exitosamente');
  } catch (err) {
    log('[electron] Error al cargar URL:', err.message);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (IS_DEV) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Ciclo de vida Electron ───────────────────────────────────
app.whenReady().then(async () => {
  log(`[electron] Iniciando EduTechHub (${IS_DEV ? 'dev' : 'producción'})...`);
  log('[electron] app.isPackaged:', app.isPackaged);
  log('[electron] process.resourcesPath:', process.resourcesPath);
  log('[electron] userData:', app.getPath('userData'));

  try {
    await startBackend();
    const ready = await waitForPort(BACKEND_PORT);
    if (!ready) log('[electron] ⚠️ Backend tardó demasiado, abriendo ventana igualmente...');
    else log('[electron] ✅ Backend verificado y listo en puerto', BACKEND_PORT);

    await createWindow();
  } catch (err) {
    log('[electron] Error crítico al iniciar:', err.message || err);
    app.quit();
  }
});

function cleanup() {
  if (backendProcess) {
    killPortOrProcess(backendProcess.pid);
    backendProcess = null;
  }
}

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  cleanup();
});

app.on('will-quit', () => {
  cleanup();
});
