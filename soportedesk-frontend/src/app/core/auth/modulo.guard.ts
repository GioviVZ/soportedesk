import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const moduloGuard = (modulo: string): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin() || authService.canRead(modulo)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
