/** Shared drawing helpers for the app's small charts. */

/** Smooth line through the points without overshooting them (monotone cubic). */
export function monotonePath(pts: [number, number][]): string {
  const n = pts.length;
  if (n < 2) return "";
  const x = pts.map((p) => p[0]);
  const y = pts.map((p) => p[1]);
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = x[i + 1] - x[i] || 1e-6;
    m[i] = (y[i + 1] - y[i]) / dx[i];
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${x[0].toFixed(1)} ${y[0].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${(x[i] + h).toFixed(1)} ${(y[i] + t[i] * h).toFixed(1)} ${(x[i + 1] - h).toFixed(1)} ${(
      y[i + 1] -
      t[i + 1] * h
    ).toFixed(1)} ${x[i + 1].toFixed(1)} ${y[i + 1].toFixed(1)}`;
  }
  return d;
}
