import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const TOKEN_KEY = 'auth_token';

function createFakeJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`;
}

function configureTestBed(): void {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([{ path: 'login', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
}

describe('AuthService', () => {
  afterEach(() => {
    localStorage.removeItem(TOKEN_KEY);
  });

  it('hydrates isAuthenticated/roles from a pre-seeded token on construction, normalizing a single-role claim to an array', () => {
    const token = createFakeJwt({
      sub: 'user-1',
      email: 'writer@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
      [ROLE_CLAIM]: 'Writer',
    });
    localStorage.setItem(TOKEN_KEY, token);
    configureTestBed();

    const auth = TestBed.inject(AuthService);

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.roles()).toEqual(['Writer']);
    expect(auth.hasRole('Writer')).toBe(true);
    expect(auth.userEmail()).toBe('writer@example.com');
  });

  it('treats an expired token as not authenticated', () => {
    const token = createFakeJwt({
      sub: 'user-1',
      email: 'writer@example.com',
      exp: Math.floor(Date.now() / 1000) - 10,
      [ROLE_CLAIM]: ['Writer'],
    });
    localStorage.setItem(TOKEN_KEY, token);
    configureTestBed();

    const auth = TestBed.inject(AuthService);

    expect(auth.isAuthenticated()).toBe(false);
  });

  it('login() persists the token and updates signals; logout() clears them', () => {
    configureTestBed();
    const auth = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    expect(auth.isAuthenticated()).toBe(false);

    const token = createFakeJwt({
      sub: 'user-2',
      email: 'admin@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
      [ROLE_CLAIM]: ['Admin', 'Writer'],
    });

    auth.login({ email: 'admin@example.com', password: 'secret123' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ userId: 'user-2', email: 'admin@example.com', token, expiresAtUtc: new Date().toISOString() });

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.roles()).toEqual(['Admin', 'Writer']);
    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();

    httpMock.verify();
  });
});
