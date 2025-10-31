import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const router = inject(Router);
  const token = authService.getToken();

  // Log HTTP request for debugging (visible in Logcat on Android/iOS)
  console.log('[HTTP Request]', req.method, req.url);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log HTTP errors for debugging
      console.error('[HTTP Error]', req.method, req.url, 'Status:', error.status, 'Message:', error.message);

      if (error.status === 401) {
        // Unauthorized - token is invalid or expired
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
