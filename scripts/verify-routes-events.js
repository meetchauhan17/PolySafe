const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING ROUTES, PAGES & SOCKET.IO EVENTS ===\n');

// 1. API Route Handlers in backend/src/routes/
const routesDir = path.join(__dirname, '../backend/src/routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
console.log('Route files in backend/src/routes:', routeFiles);

let totalHandlers = 0;
const handlersByFile = {};

routeFiles.forEach(f => {
  const content = fs.readFileSync(path.join(routesDir, f), 'utf8');
  // Match router.get, router.post, router.put, router.delete, router.patch
  const matches = content.match(/router\.(get|post|put|delete|patch)\s*\(/g) || [];
  handlersByFile[f] = matches.length;
  totalHandlers += matches.length;
});

// Also check backend/src/index.js for app.get, app.post, etc.
const indexContent = fs.readFileSync(path.join(__dirname, '../backend/src/index.js'), 'utf8');
const appMatches = indexContent.match(/app\.(get|post|put|delete|patch)\s*\(/g) || [];
handlersByFile['index.js'] = appMatches.length;
totalHandlers += appMatches.length;

console.log('API Route Handlers by file:', handlersByFile);
console.log('Total API Route Handlers:', totalHandlers);

// 2. Frontend Pages / Routes
const pagesDir = path.join(__dirname, '../frontend/src/pages');
const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
console.log('\nFrontend page files in frontend/src/pages (' + pageFiles.length + '):', pageFiles);

// Check routes in frontend/src/App.jsx
const appJsx = fs.readFileSync(path.join(__dirname, '../frontend/src/App.jsx'), 'utf8');
const routeTags = appJsx.match(/<Route\s+[^>]*path=["']([^"']+)["']/g) || [];
const routePaths = routeTags.map(r => {
  const m = r.match(/path=["']([^"']+)["']/);
  return m ? m[1] : null;
}).filter(Boolean);
console.log('Declared <Route> paths in App.jsx (' + routePaths.length + '):', routePaths);

// 3. Socket.IO Events
// Search all emit, on in backend
const backendSrcDir = path.join(__dirname, '../backend/src');
function findSocketEvents(dir, events = { emit: new Set(), on: new Set() }) {
  fs.readdirSync(dir).forEach(item => {
    const p = path.join(dir, item);
    if (fs.statSync(p).isDirectory()) {
      findSocketEvents(p, events);
    } else if (item.endsWith('.js')) {
      const c = fs.readFileSync(p, 'utf8');
      // match socket.on('event', ...), io.emit('event', ...)
      const onMatches = c.matchAll(/socket\.on\(\s*['"]([^'"]+)['"]/g);
      for (const m of onMatches) events.on.add(m[1]);
      const emitMatches = c.matchAll(/(?:io|socket|patientNamespace|doctorNamespace|caregiverNamespace)\.emit\(\s*['"]([^'"]+)['"]/g);
      for (const m of emitMatches) events.emit.add(m[1]);
      const emitHelperMatches = c.matchAll(/emitTo\w+\([^,]+,\s*['"]([^'"]+)['"]/g);
      for (const m of emitHelperMatches) events.emit.add(m[1]);
      const genericEmit = c.matchAll(/\.emit\(\s*['"]([^'"]+)['"]/g);
      for (const m of genericEmit) events.emit.add(m[1]);
    }
  });
  return events;
}

const socketEvents = findSocketEvents(backendSrcDir);
console.log('\nSocket.IO Events in backend:');
console.log(' - Listening (socket.on):', Array.from(socketEvents.on));
console.log(' - Emitting (.emit):', Array.from(socketEvents.emit));

// Also check frontend for socket.on / socket.emit
const frontendSrcDir = path.join(__dirname, '../frontend/src');
const feSocketEvents = findSocketEvents(frontendSrcDir);
console.log('\nSocket.IO Events in frontend:');
console.log(' - Listening (socket.on):', Array.from(feSocketEvents.on));
console.log(' - Emitting (socket.emit):', Array.from(feSocketEvents.emit));
