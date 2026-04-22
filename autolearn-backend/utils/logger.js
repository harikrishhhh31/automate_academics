// Session logger - all logs are in-memory only, cleared on disconnect
const sessions = new Map();

export const createSession = (id) => {
  sessions.set(id, []);
  return id;
};

export const logEntry = (sessionId, type, text) => {
  const entry = { time: new Date().toISOString(), type, text };
  const session = sessions.get(sessionId);
  if (session) session.push(entry);
  console.log(`[${type.toUpperCase()}] ${text}`);
  return entry;
};

export const clearSession = (sessionId) => {
  sessions.delete(sessionId);
};

export const getSession = (sessionId) => sessions.get(sessionId) || [];
