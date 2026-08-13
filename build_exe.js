#!/usr/bin/env node
/**
 * EduTechHub — Script de Build para Distribución
 * ================================================
 * Genera el ejecutable Windows (.exe) con todos los componentes.
 *
 * PASOS:
 *   1. Verifica que la BD esté limpia
 *   2. Build del frontend (Vite → dist/)
 *   3. Compilación del backend (tsc → dist/backend)
 *   4. Empaquetado con electron-builder → release/
 *
 * USO:
 *   node build_exe.js
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;

function run(cmd, cwd = ROOT) {
  console.log(`\n▶ ${cmd}`);
  const result = spawnSync(cmd, { cwd, shell: true, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`\n❌ Falló: ${cmd}`);
    process.exit(result.status || 1);
  }
}

function checkFile(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`\n❌ No encontrado: ${label} → ${p}`);
    process.exit(1);
  }
  console.log(`  ✅ ${label}`);
}

async function main() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  📦  EduTechHub — Build de Distribución Windows');
  console.log('════════════════════════════════════════════════════\n');

  // 1. Verificaciones previas
  console.log('─── [1/4] Verificaciones previas ───────────────────\n');
  checkFile(path.join(ROOT, 'database', 'edutechhub.sql'), 'Base de datos SQLite');
  checkFile(path.join(ROOT, 'backend', '.env'), 'Variables de entorno backend');
  checkFile(path.join(ROOT, 'electron', 'main.js'), 'Electron main.js');

  // 2. Build frontend (Vite)
  console.log('\n─── [2/4] Build Frontend (Vite) ─────────────────────\n');
  run('npm run build');
  checkFile(path.join(ROOT, 'dist', 'index.html'), 'dist/index.html');

  // 3. Compilar backend TypeScript
  console.log('\n─── [3/4] Compilar Backend (TypeScript) ─────────────\n');
  run('npx tsc -p tsconfig.app.json --outDir dist_backend');
  checkFile(path.join(ROOT, 'dist_backend', 'backend', 'server.js'), 'dist_backend/backend/server.js');

  // 4. Instalar electron-builder si no está
  console.log('\n─── [4/4] Empaquetar con electron-builder ───────────\n');
  try {
    execSync('npx electron-builder --version', { stdio: 'pipe' });
  } catch {
    console.log('Instalando electron-builder...');
    run('npm install -D electron electron-builder');
  }

  // Copiar la configuración del build al package.json principal
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const electronPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'electron', 'package.json'), 'utf-8'));
  
  // Merge temporal para electron-builder
  const merged = { ...pkg, ...electronPkg, scripts: pkg.scripts, dependencies: pkg.dependencies, devDependencies: pkg.devDependencies };
  fs.writeFileSync(pkgPath + '.bak', JSON.stringify(pkg, null, 2));
  fs.writeFileSync(pkgPath, JSON.stringify(merged, null, 2));

  try {
    run('npx electron-builder --win --x64');
  } finally {
    // Restaurar package.json original
    fs.writeFileSync(pkgPath, fs.readFileSync(pkgPath + '.bak', 'utf-8'));
    fs.unlinkSync(pkgPath + '.bak');
  }

  // Resultados
  const releaseDir = path.join(ROOT, 'release');
  console.log('\n════════════════════════════════════════════════════');
  console.log('  ✅  Build completado exitosamente');
  console.log(`  📁  Ejecutables en: ${releaseDir}`);
  
  if (fs.existsSync(releaseDir)) {
    const files = fs.readdirSync(releaseDir).filter(f => f.endsWith('.exe'));
    files.forEach(f => console.log(`     → ${f}`));
  }
  console.log('════════════════════════════════════════════════════\n');
}

main().catch(e => { console.error(e); process.exit(1); });
