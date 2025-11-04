import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserAuthService } from '../services/user-auth.service';


export const sessionCheckGuard: CanActivateFn = (route, state) => {
  const authService = inject(UserAuthService);
  const router = inject(Router);

  const fromMP = sessionStorage.getItem('mercadoPagoRedirect') === 'true';

  if (fromMP) {
    console.log('🔄 Retornando de Mercado Pago, verificando sesión...');
    sessionStorage.removeItem('mercadoPagoRedirect');

    let token = localStorage.getItem('token');
    let userData = localStorage.getItem('currentUser');

    if (!token || !userData) {
      console.warn('⚠️ Sesión no encontrada, intentando restaurar...');

      const tempToken = sessionStorage.getItem('mp_temp_token');
      const tempUser = sessionStorage.getItem('mp_temp_user');

      if (tempToken && tempUser) {
        localStorage.setItem('token', tempToken);
        localStorage.setItem('currentUser', tempUser);
        sessionStorage.removeItem('mp_temp_token');
        sessionStorage.removeItem('mp_temp_user');

        console.log('✅ Sesión restaurada exitosamente después de MP');
        authService.checkAndRestoreSession?.(); // si tu servicio tiene ese método
        return true;
      }

      console.error('❌ No se encontró información de sesión para restaurar');
      return router.parseUrl('/login?returnUrl=' + state.url);
    }

    console.log('✅ Sesión verificada correctamente después de MP');
    authService.checkAndRestoreSession?.();
  }

  return true;
};