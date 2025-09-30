export function readCookie(key: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const cookie of cookies) {
    if (!cookie) continue;
    const [name, ...rest] = cookie.split('=');
    if (name === key) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

export function writeCookie(key: string, value: string, days = 365) {
  if (typeof document === 'undefined') {
    return;
  }

  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; sameSite=Lax`;
}

export function deleteCookie(key: string) {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${key}=; path=/; max-age=0; sameSite=Lax`;
}

export function readJsonCookie<T>(key: string, fallback: T): T {
  try {
    const raw = readCookie(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to parse cookie ${key}`, error);
    return fallback;
  }
}

export function writeJsonCookie<T>(key: string, value: T, days = 365) {
  try {
    writeCookie(key, JSON.stringify(value), days);
  } catch (error) {
    console.warn(`Failed to write cookie ${key}`, error);
  }
}
