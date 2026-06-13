import { useState, useEffect, useRef } from 'react';

export const useAutoLearn = (initialUrl) => {
  const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:3001`;
  const [url, setUrl] = useState(initialUrl || wsUrl);
  const [status, setStatus] = useState('Disconnected');
  const [logs, setLogs] = useState([]);
  const [image, setImage] = useState(null);
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket(url);
    
    wsRef.current.onopen = () => {
      setStatus('Connected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'stream') {
          setImage(`data:image/jpeg;base64,${message.data}`);
        } else if (message.type === 'status') {
          setStatus(message.data);
          setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: message.data, type: 'status' }]);
        } else if (message.type === 'log') {
          setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: message.data, type: 'log' }]);
        } else if (message.type === 'error') {
          setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: message.data, type: 'error' }]);
        } else if (message.type === 'confirmation_required') {
          setRequireConfirmation(message.data);
        }
      } catch (e) {
        console.error('Error parsing message', e);
      }
    };

    wsRef.current.onclose = () => {
      setStatus('Disconnected');
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [url]);

  const startAutomation = (platform, targetUrl, userInfo) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setLogs([]);
      setRequireConfirmation(false);
      wsRef.current.send(JSON.stringify({
        command: 'start',
        platform,
        url: targetUrl,
        userInfo
      }));
    }
  };

  const stopAutomation = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: 'stop' }));
    }
  };

  const confirmSubmit = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: 'confirm' }));
      setRequireConfirmation(false);
    }
  };

  return { status, logs, image, requireConfirmation, startAutomation, stopAutomation, confirmSubmit };
};
