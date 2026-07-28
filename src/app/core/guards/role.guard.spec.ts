import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';

function setup(isAuthenticated: boolean, roles: string[]): void {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: AuthService,
        useValue: {
          isAuthenticated: () => isAuthenticated,
          hasRole: (role: string) => roles.includes(role),
        },
      },
    ],
  });
}

function runGuard(requiredRoles: string[]) {
  const guard = roleGuard(requiredRoles);
  return TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
}

describe('roleGuard', () => {
  it('redirects to /login when not authenticated', () => {
    setup(false, []);
    expect(runGuard(['Admin']) instanceof UrlTree).toBe(true);
  });

  it('redirects to /dashboard when authenticated but missing the required role', () => {
    setup(true, ['Writer']);
    expect(runGuard(['Admin']) instanceof UrlTree).toBe(true);
  });

  it('allows navigation when the user has one of the required roles', () => {
    setup(true, ['Admin']);
    expect(runGuard(['Admin'])).toBe(true);
  });
});
