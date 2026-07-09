import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return authService.refreshSession().pipe(
      map(() => true),
      catchError(() => {
        authService.logout();
        router.navigate(['/login']);
        return of(false);
      }),
    );
  }

  router.navigate(['/login']);
  return false;
};
