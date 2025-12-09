import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserAuthService } from '../services/user-auth.service';


export const sessionCheckGuard: CanActivateFn = (route, state) => {
  console.log(' SESSION CHECK GUARD ACTIVADO');
  console.log(' Ruta:', state.url);
  
  const authService = inject(UserAuthService);
  
  const urlParams = new URLSearchParams(window.location.search);
  const hasMPParams = urlParams.has('collection_id') || 
                     urlParams.has('payment_id') || 
                     urlParams.has('preference_id') ||
                     urlParams.has('external_reference');
  
  const mpRedirect = localStorage.getItem('mp_redirect') === 'true';
  const fromMP = mpRedirect || hasMPParams;
  
  console.log(' Detección MP:', {
    mpRedirect,
    hasMPParams,
    fromMP,
    collection_id: urlParams.get('collection_id')
  });

  if (fromMP) {
    console.log(' RETORNO DE MERCADO PAGO DETECTADO');
    
    const currentToken = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    console.log(' Estado de sesión actual:', {
      token: !!currentToken,
      user: !!currentUser
    });
    
    if (!currentToken || !currentUser) {
      console.log(' SESIÓN PERDIDA - Restaurando desde backup...');
      
      const backupToken = localStorage.getItem('mp_backup_token');
      const backupUser = localStorage.getItem('mp_backup_user');
      
      console.log(' Backup disponible:', {
        token: !!backupToken,
        user: !!backupUser
      });
      
      if (backupToken && backupUser) {
        console.log(' RESTAURANDO SESIÓN...');
        
        localStorage.setItem('token', backupToken);
        localStorage.setItem('currentUser', backupUser);
        
        authService.checkAndRestoreSession();
        
        console.log(' SESIÓN RESTAURADA EXITOSAMENTE');
      } else {
        console.error(' NO HAY BACKUP DISPONIBLE');
      }
    } else {
      console.log(' Sesión intacta, no se necesita restaurar');
    }
    
    console.log('Limpiando flags de MP...');
    localStorage.removeItem('mp_redirect');
    localStorage.removeItem('mp_backup_token');
    localStorage.removeItem('mp_backup_user');
    
    const timestamp = localStorage.getItem('mp_timestamp');
    if (timestamp) {
      const elapsed = Date.now() - parseInt(timestamp);
      console.log(`Tiempo transcurrido: ${Math.round(elapsed / 1000)}s`);
      localStorage.removeItem('mp_timestamp');
    }
  }

  console.log(' GUARD COMPLETADO');
  return true;
};