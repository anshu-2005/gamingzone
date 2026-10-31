export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function formatDistance(km) {
  return Number(km || 0).toFixed(2);
}

export function formatNumber(num) {
  return Math.round(num || 0).toLocaleString();
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

export function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

export function checkAABBCollision(box1, box2) {
  return (
    box1.x - box1.width / 2 < box2.x + box2.width / 2 &&
    box1.x + box1.width / 2 > box2.x - box2.width / 2 &&
    box1.z - box1.length / 2 < box2.z + box2.length / 2 &&
    box1.z + box1.length / 2 > box2.z - box2.length / 2
  );
}

export function hexToRgb(hex) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return {
      r: (c >> 16) & 255,
      g: (c >> 8) & 255,
      b: c & 255
    };
  }
  return { r: 255, g: 255, b: 255 };
}

export function rgba(hex, alpha = 1) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
