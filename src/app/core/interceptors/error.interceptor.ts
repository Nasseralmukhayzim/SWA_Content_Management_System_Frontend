import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AppError, ValidationProblemDetails } from '../models/problem-details.models';
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

      const body = error.error as Partial<ValidationProblemDetails> | null;
      const appError: AppError = {
        title: body?.title ?? 'Unexpected error',
        detail: body?.detail,
        status: error.status,
        fieldErrors: body?.errors,
      };

      return throwError(() => appError);
    }),
  );
};
