import { DecodedClaims } from '../models/auth.models';

/**
 * The backend's JwtTokenGenerator adds roles via `new Claim(ClaimTypes.Role, role)`,
 * which serializes under the full ClaimTypes URI, not a short "role"/"roles" key.
 */
export const ROLE_CLAIM_TYPE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export function decodeJwt(token: string | null): DecodedClaims | null {
  if (!token) {
    return null;
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(segments[1])) as Record<string, unknown>;
    return {
      sub: String(payload['sub'] ?? ''),
      email: String(payload['email'] ?? ''),
      roles: normalizeRoles(payload[ROLE_CLAIM_TYPE]),
      exp: Number(payload['exp'] ?? 0),
      firstName: payload['given_name'] ? String(payload['given_name']) : undefined,
      lastName: payload['family_name'] ? String(payload['family_name']) : undefined,
    };
  } catch {
    return null;
  }
}

// A JWT claim with a single value serializes as a bare string, not a one-item array.
function normalizeRoles(rawRoles: unknown): string[] {
  if (Array.isArray(rawRoles)) {
    return rawRoles.map(String);
  }
  return rawRoles ? [String(rawRoles)] : [];
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}
