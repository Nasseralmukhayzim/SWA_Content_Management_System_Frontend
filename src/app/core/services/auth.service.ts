import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthenticationResponse, LoginRequest, SignupRequest } from '../models/auth.models';
import { decodeJwt } from '../utils/jwt.util';

const TOKEN_STORAGE_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  private readonly _claims = signal(decodeJwt(this._token()));

  readonly token = this._token.asReadonly();

  readonly isAuthenticated = computed(() => {
    const claims = this._claims();
    return claims !== null && claims.exp * 1000 > Date.now();
  });

  readonly roles = computed(() => this._claims()?.roles ?? []);
  readonly userEmail = computed(() => this._claims()?.email ?? null);

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  login(request: LoginRequest): Observable<AuthenticationResponse> {
    return this.http
      .post<AuthenticationResponse>(`${environment.apiBaseUrl}/api/auth/login`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  signup(request: SignupRequest): Observable<AuthenticationResponse> {
    return this.http
      .post<AuthenticationResponse>(`${environment.apiBaseUrl}/api/auth/signup`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this._token.set(null);
    this._claims.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(response: AuthenticationResponse): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    this._token.set(response.token);
    this._claims.set(decodeJwt(response.token));
  }
}
