import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserAuthService } from '../services/user-auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(UserAuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  const returnUrl = state.url;
  
  router.navigate(['/login'], { 
    queryParams: { 
      returnUrl: returnUrl,
      message: 'Debes iniciar sesión para acceder a esta función'
    } 
  });
  
  return false;
};