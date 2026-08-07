import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // Construye el layout inmediatamente con la sesión local y sincroniza
    // los permisos en segundo plano. Cada API continúa validando el token.
    authService.refreshSession().subscribe({
      error: () => {
        authService.logout();
        router.navigate(['/login']);
      },
    });
    return true;
  }

  router.navigate(['/login']);
  return false;
};
