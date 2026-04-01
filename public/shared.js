const RETRY_DELAY_MS = 1500;

export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export function formatTimestamp(value) {
  if (!value) {
    return 'Unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}

export function connectSocket(role, handlers = {}) {
  let socket;
  let shouldReconnect = true;

  const connect = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${protocol}://${window.location.host}/ws?role=${encodeURIComponent(role)}`);

    socket.addEventListener('open', () => {
      handlers.onOpen?.();
    });

    socket.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'state.snapshot') {
        handlers.onSnapshot?.(payload.data, payload.system);
      }

      if (payload.type === 'event.created') {
        handlers.onEvent?.(payload.data, payload.system);
      }
    });

    socket.addEventListener('close', () => {
      handlers.onClose?.();
      if (shouldReconnect) {
        window.setTimeout(connect, RETRY_DELAY_MS);
      }
    });
  };

  connect();

  return {
    close() {
      shouldReconnect = false;
      socket?.close();
    },
  };
}

export function drawSeriesChart(canvas, points, options) {
  const context = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width || 320));
  const height = Math.max(180, Math.floor(rect.height || 180));
  const ratio = window.devicePixelRatio || 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  context.fillStyle = '#f6f0e8';
  context.fillRect(0, 0, width, height);

  context.strokeStyle = '#d6c9b4';
  context.lineWidth = 1;
  for (let index = 0; index < 4; index += 1) {
    const y = 24 + ((height - 48) / 3) * index;
    context.beginPath();
    context.moveTo(18, y);
    context.lineTo(width - 18, y);
    context.stroke();
  }

  if (!points.length) {
    context.fillStyle = '#6d655c';
    context.font = '16px "Avenir Next", "Segoe UI", sans-serif';
    context.fillText('Awaiting data', 24, height / 2);
    return;
  }

  const values = points.map((point) => point.value);
  const minValue = Number.isFinite(options.min) ? options.min : Math.min(...values);
  const maxValue = Number.isFinite(options.max) ? options.max : Math.max(...values);
  const range = Math.max(0.0001, maxValue - minValue);

  context.beginPath();
  context.strokeStyle = options.stroke || '#0a7a78';
  context.lineWidth = 3;

  points.forEach((point, index) => {
    const x = 18 + ((width - 36) * index) / Math.max(1, points.length - 1);
    const y = height - 24 - ((point.value - minValue) / range) * (height - 48);
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  context.stroke();

  context.fillStyle = '#2c2621';
  context.font = '14px "Avenir Next", "Segoe UI", sans-serif';
  context.fillText(options.label, 18, 18);
}
