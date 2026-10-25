/**
 * Phone sign-in.
 *
 * MOCK: there is no backend yet. These functions simulate network latency so the UI
 * states (sending, verifying, error, success) can be designed and tested.
 * Replace with calls to the Django API (phone OTP) when it exists.
 *
 * Demo rule: every 5-digit code is accepted except 00000, which returns "wrong code".
 */

export const OTP_LENGTH = 5;
export const RESEND_SECONDS = 60;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function requestOtp(mobile: string): Promise<{ ok: true }> {
  void mobile;
  await wait(800);
  return { ok: true };
}

export async function verifyOtp(
  mobile: string,
  code: string,
): Promise<{ ok: true } | { ok: false; reason: "wrong-code" }> {
  void mobile;
  await wait(900);
  if (code === "00000") return { ok: false, reason: "wrong-code" };
  return { ok: true };
}
