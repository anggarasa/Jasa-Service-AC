import { cookies } from 'next/headers';
import { AuthUser } from '@tampilkit-ac/api-contract';

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  'http://127.0.0.1:3001';

export async function getServerSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get('tk_ac_access')?.value;
  const refreshCookie = cookieStore.get('tk_ac_refresh')?.value;

  if (!accessCookie && !refreshCookie) {
    return null;
  }

  const cookieHeader = [
    accessCookie ? `tk_ac_access=${accessCookie}` : '',
    refreshCookie ? `tk_ac_refresh=${refreshCookie}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    if (json.success && json.data) {
      return json.data as AuthUser;
    }

    return null;
  } catch {
    return null;
  }
}
