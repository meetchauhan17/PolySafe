#!/usr/bin/env node
/**
 * scripts/demo-runner.js
 * 
 * One-command venue fallback runner:
 * 1. Checks/runs database migrations in backend/
 * 2. Checks if database is empty; if so, automatically seeds demo patient & doctor
 * 3. Starts backend with DEMO_MODE=true on port 5000
 * 4. Starts frontend Vite dev server
 * 5. Handles graceful shutdown on SIGINT / SIGTERM
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

console.log('================================================================');
console.log('      PolySafe Venue Fallback & Local Demo Runner               ');
console.log('================================================================');

// Step 1: Run database migrations / check
try {
  console.log('\n[1/3] Checking database schema & running migrations...');
  execSync('npx prisma db push --skip-generate', {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: { ...process.env },
  });
} catch (err) {
  console.warn('[!] Note: Database push/migration completed with warnings. Continuing...');
}

// Step 2: Seed demo data if database is empty or requested
async function checkAndSeed() {
  try {
    console.log('\n[2/3] Checking demo seeds...');
    const { PrismaClient } = require(path.join(BACKEND_DIR, 'node_modules', '@prisma/client'));
    const prisma = new PrismaClient();
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('[+] Users table is empty. Seeding demo accounts and medications...');
        execSync('node scripts/reset-demo-data.js', {
          cwd: BACKEND_DIR,
          stdio: 'inherit',
          env: { ...process.env },
        });
      } else {
        console.log(`[✔] Database already contains ${userCount} users. Ready!`);
      }
    } catch (e) {
      console.warn('[!] DB count query note (continuing with DEMO_MODE fallback):', e.message);
    } finally {
      await prisma.$disconnect();
    }
  } catch (err) {
    console.log('[!] Prisma client note. Proceeding to launch...');
  }

  startServices();
}

function startServices() {
  console.log('\n[3/3] Starting Backend (DEMO_MODE=true) and Frontend Vite Dev...');
  console.log('----------------------------------------------------------------');

  const backendEnv = {
    ...process.env,
    DEMO_MODE: 'true',
    PORT: process.env.PORT || '5000',
  };

  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';
  const nodeCmd = process.execPath;

  // Launch backend
  const backendProc = spawn(nodeCmd, ['src/index.js'], {
    cwd: BACKEND_DIR,
    env: backendEnv,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  backendProc.stdout.on('data', (d) => {
    process.stdout.write(`\x1b[36m[Backend]\x1b[0m ${d.toString()}`);
  });
  backendProc.stderr.on('data', (d) => {
    process.stderr.write(`\x1b[31m[Backend Error]\x1b[0m ${d.toString()}`);
  });

  // Launch frontend
  const frontendProc = spawn(npmCmd, ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    env: { ...process.env },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  frontendProc.stdout.on('data', (d) => {
    process.stdout.write(`\x1b[32m[Frontend]\x1b[0m ${d.toString()}`);
  });
  frontendProc.stderr.on('data', (d) => {
    process.stderr.write(`\x1b[33m[Frontend Info]\x1b[0m ${d.toString()}`);
  });

  function cleanExit() {
    console.log('\nStopping PolySafe services...');
    try { backendProc.kill(); } catch (e) {}
    try { frontendProc.kill(); } catch (e) {}
    process.exit(0);
  }

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);
}

checkAndSeed();
