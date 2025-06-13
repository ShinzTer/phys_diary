import { useState, useEffect } from 'react';

const WS_PORT = 5000; // Same port as the server
const WS_HOST = '127.0.0.1';

export function setupWebSocket(token: string) {
  const ws = new WebSocket(`ws://${WS_HOST}:${WS_PORT}/?token=${token}`);

  ws.onopen = () => {
    console.log('WebSocket connection established');
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
    // Implement reconnection logic if needed
    setTimeout(() => {
      setupWebSocket(token);
    }, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}

export function useWebSocket(token: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    const websocket = setupWebSocket(token);
    setWs(websocket);

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [token]);

  return ws;
} 