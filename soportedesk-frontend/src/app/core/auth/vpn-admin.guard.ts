import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const vpnAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin() || authService.canWrite('solicitar-vpn') || authService.canWrite('aprobar-vpn')) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
