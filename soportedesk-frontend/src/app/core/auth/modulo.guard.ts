import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const moduloGuard = (modulo: string, options?: { write?: boolean }): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin() || (options?.write ? authService.canWrite(modulo) : authService.canRead(modulo))) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
