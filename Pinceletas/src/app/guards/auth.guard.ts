import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserAuthService } from '../services/user-auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 * Si el usuario no está logeado, redirige a /login guardando la URL actual
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(UserAuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Guardar la URL a la que intentaba acceder
  const returnUrl = state.url;
  
  // Redirigir al login con mensaje personalizado
  router.navigate(['/login'], { 
    queryParams: { 
      returnUrl: returnUrl,
      message: 'Debes iniciar sesión para acceder a esta función'
    } 
  });
  
  return false;
};