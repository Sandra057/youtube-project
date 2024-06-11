const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const calls = {}; // { callId: [clients] }

wss.on('connection', ws => {
  ws.on('message', message => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'create-call':
        const callId = uuidv4().slice(0, 6); // Generate 6-digit call ID
        calls[callId] = [ws];
        ws.send(JSON.stringify({ type: 'call-created', callId }));
        break;
      case 'join-call':
        if (calls[data.callId]) {
          calls[data.callId].push(ws);
          ws.send(JSON.stringify({ type: 'call-joined', callId: data.callId }));
          calls[data.callId].forEach(client => {
            if (client !== ws) {
              client.send(JSON.stringify({ type: 'new-participant' }));
            }
          });
        } else {
          ws.send(JSON.stringify({ type: 'call-not-found' }));
        }
        break;
      case 'signal':
        if (calls[data.callId]) {
          calls[data.callId].forEach(client => {
            if (client !== ws) {
              client.send(JSON.stringify({ type: 'signal', signal: data.signal }));
            }
          });
        }
        break;
    }
  });

  ws.on('close', () => {
    // Remove client from calls
    for (const callId in calls) {
      calls[callId] = calls[callId].filter(client => client !== ws);
      if (calls[callId].length === 0) {
        delete calls[callId];
      }
    }
  });
});

server.listen(3002, () => {
  console.log('Signaling server is running on port 3002');
});