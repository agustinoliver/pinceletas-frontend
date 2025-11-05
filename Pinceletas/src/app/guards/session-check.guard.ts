import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserAuthService } from '../services/user-auth.service';


export const sessionCheckGuard: CanActivateFn = (route, state) => {
  console.log('🛡️🛡️🛡️ GUARD ACTIVADO para:', state.url);
  
  // ✅ DETECTAR SI VENIMOS DE MP POR LA URL (MÁS AGRESIVO)
  const urlParams = new URLSearchParams(window.location.search);
  const hasMPParams = urlParams.has('collection_id') || 
                     urlParams.has('payment_id') || 
                     urlParams.has('preference_id') ||
                     urlParams.has('external_reference');
  
  const fromMPStorage = localStorage.getItem('mercadoPagoRedirect') === 'true';
  const fromMP = fromMPStorage || hasMPParams;
  
  console.log('🔍 Detección MP:');
  console.log('   - Storage flag:', fromMPStorage);
  console.log('   - URL params:', hasMPParams);
  console.log('   - collection_id:', urlParams.get('collection_id'));
  console.log('   - Viniendo de MP:', fromMP);

  if (fromMP) {
    console.log('🎯🎯🎯 RETORNO DE MP DETECTADO - RESTAURANDO SESIÓN...');
    
    // Limpiar flag
    localStorage.removeItem('mercadoPagoRedirect');
    
    // Verificar y restaurar sesión
    const currentToken = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    console.log('📊 Estado actual de sesión:');
    console.log('   - Token:', !!currentToken);
    console.log('   - User:', !!currentUser);
    
    if (!currentToken || !currentUser) {
      console.log('🔄 SESIÓN PERDIDA - RESTAURANDO DESDE BACKUP...');
      
      const backupToken = localStorage.getItem('mp_backup_token');
      const backupUser = localStorage.getItem('mp_backup_user');
      
      console.log('📦 Backup disponible:');
      console.log('   - Backup Token:', !!backupToken);
      console.log('   - Backup User:', !!backupUser);
      
      if (backupToken && backupUser) {
        console.log('✅ RESTAURANDO SESIÓN...');
        localStorage.setItem('token', backupToken);
        localStorage.setItem('currentUser', backupUser);
        
        // Limpiar backup
        localStorage.removeItem('mp_backup_token');
        localStorage.removeItem('mp_backup_user');
        
        console.log('🎉 SESIÓN RESTAURADA EXITOSAMENTE');
        
        // Forzar recarga del usuario en el servicio
        const authService = inject(UserAuthService);
        authService.checkAndRestoreSession();
      } else {
        console.error('❌ NO HAY BACKUP PARA RESTAURAR');
      }
    } else {
      console.log('✅ SESIÓN INTACTA - LIMPIANDO BACKUP');
      // Limpiar backup si no se necesita
      localStorage.removeItem('mp_backup_token');
      localStorage.removeItem('mp_backup_user');
    }
  }

  console.log('✅ GUARD COMPLETADO');
  return true;
};