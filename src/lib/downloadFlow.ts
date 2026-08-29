import { DMG_PATH, GOOGLE_SHEETS_ENDPOINT } from '../config';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function getCountry(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.country_name || '';
  } catch {
    return ''; // must fail quietly — this can never throw or hang the caller
  }
}

export function getSourceParam(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('src') || 'direct';
}

export function logVisit(source: string, country: string): void {
  if (!GOOGLE_SHEETS_ENDPOINT) return;

  const body = new URLSearchParams({ type: 'visit', source, country });

  fetch(GOOGLE_SHEETS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => {
    // intentionally swallowed — same fire-and-forget philosophy as logDownload
  });
}

export function logDownload(email: string, country: string, source: string): void {
  if (!GOOGLE_SHEETS_ENDPOINT) return;

  const body = new URLSearchParams({ type: 'download', email, country, source });

  fetch(GOOGLE_SHEETS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => {
    // intentionally swallowed — losing an email is fine, blocking a download is not
  });
}

export function triggerDownload(): void {
  const link = document.createElement('a');
  link.href = DMG_PATH;
  link.download = 'FlowState.dmg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
