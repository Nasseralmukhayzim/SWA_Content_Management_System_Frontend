import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AppError, ResultError, ValidationProblemDetails } from '../models/problem-details.models';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        auth.logout();
      }

      const body = error.error as (Partial<ValidationProblemDetails> & Partial<ResultError>) | null;
      const appError: AppError = {
        title: body?.title ?? body?.description ?? defaultTitleFor(error.status),
        detail: body?.detail,
        status: error.status,
        fieldErrors: body?.errors,
      };

      return throwError(() => appError);
    }),
  );
};

/**
 * [Authorize] failures and network drops never carry a ProblemDetails body — without this,
 * every one of them showed the same unhelpful "Unexpected error", whether the real cause was
 * a missing permission, a dead connection, or a since-deleted record.
 */
function defaultTitleFor(status: number): string {
  switch (status) {
    case 0:
      return 'Could not reach the server. Check your connection and try again.';
    case 403:
      return "You don't have permission to do this.";
    case 404:
      return 'Not found — it may have already been deleted.';
    default:
      return 'Unexpected error';
  }
}
