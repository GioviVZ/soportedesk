import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

export const auditoriaGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin() || authService.canWrite('auditoria')) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
