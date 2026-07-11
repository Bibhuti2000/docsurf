require('dotenv/config');
const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const Y = require('yjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

setPersistence({
  bindState: async (docName, ydoc) => {
    try {
      const doc = await prisma.document.findUnique({ where: { id: docName } });
      if (doc && doc.content) {
        Y.applyUpdate(ydoc, doc.content);
      }

      // Hook up a debounced auto-save listener on any document update
      let saveTimeout = null;
      ydoc.on('update', () => {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          try {
            const stateVector = Y.encodeStateAsUpdate(ydoc);
            const buffer = Buffer.from(stateVector);
            await prisma.document.update({
              where: { id: docName },
              data: { content: buffer }
            });
            console.log(`Auto-saved document ${docName} to database.`);
          } catch (err) {
            console.error(`Auto-save failed for document ${docName}:`, err);
          }
        }, 5000); // Auto-save 5 seconds after typing stops
      });
    } catch (e) {
      console.error('Error binding state for doc', docName, e);
    }
  },
  writeState: async (docName, ydoc) => {
    try {
      const stateVector = Y.encodeStateAsUpdate(ydoc);
      const buffer = Buffer.from(stateVector);
      await prisma.document.update({
        where: { id: docName },
        data: { content: buffer }
      });
      console.log(`Document ${docName} saved to database.`);
    } catch (e) {
      console.error(`Failed to save document ${docName}:`, e);
    }
  }
});

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Yjs WebSocket Server is running.');
});

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', setupWSConnection);

server.on('upgrade', async (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  try {
    const cookieHeader = `authjs.session-token=${token}; __Secure-authjs.session-token=${token}`;
    const authUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${authUrl}/api/auth/session`, { headers: { cookie: cookieHeader } });
    const session = await res.json();

    if (!session || !session.user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request);
    });
  } catch (error) {
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
  }
});

const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`Yjs WebSocket Server listening on port ${PORT}`);
});

