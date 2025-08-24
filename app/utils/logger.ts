const BETTERSTACK_URL = 'https://s1347856.eu-nbg-2.betterstackdata.com';
const BETTERSTACK_TOKEN = 'Cj3D6uDVg4ZHybZoXDYUaCCd';

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
}

async function sendLog(level: string, message: string) {
  try {
    await fetch(BETTERSTACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BETTERSTACK_TOKEN}`,
      },
      body: JSON.stringify({
        dt: getTimestamp(),
        message: `[${level}] ${message}`,
      }),
    });
  } catch (err) {
    console.error('Failed to send log to Better Stack:', err);
  }
}

export const logger = {
  debug: (msg: string) => sendLog('DEBUG', msg),
  info: (msg: string) => sendLog('INFO', msg),
  warning: (msg: string) => sendLog('WARNING', msg),
  error: (msg: string) => sendLog('ERROR', msg),
}; 
