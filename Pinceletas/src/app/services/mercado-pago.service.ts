import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MercadoPagoService {

  // 🧪 Configuración de modo de prueba
  private readonly TEST_MODE = false; // Cambiar a false en producción

  constructor() { }

  /**
   * Redirige al usuario a Mercado Pago Checkout
   * @param checkoutUrl - URL del checkout (initPoint o sandboxInitPoint)
   */
  redirectToMercadoPago(checkoutUrl: string): void {
  console.log('💾 GUARDANDO EN localStorage (persistente)');
  
  // ✅ USAR localStorage QUE PERSISTE entre ventanas/contextos
  localStorage.setItem('mercadoPagoRedirect', 'true');
  localStorage.setItem('mercadoPagoTimestamp', Date.now().toString());

  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('currentUser');

  console.log('📦 Datos a guardar:');
  console.log('   - Token:', !!token);
  console.log('   - UserData:', !!userData);

  if (!token || !userData) {
    console.error('❌ ERROR: No hay sesión para guardar');
    throw new Error('Sesión no encontrada');
  }

  // ✅ GUARDAR BACKUP en localStorage
  localStorage.setItem('mp_backup_token', token);
  localStorage.setItem('mp_backup_user', userData);
  
  console.log('✅ Backup guardado en localStorage');
  console.log('🚀 Redirigiendo a Mercado Pago...');

  window.location.href = checkoutUrl;
}

  /**
   * Selecciona automáticamente la URL correcta según el modo
   * @param initPoint - URL de producción
   * @param sandboxInitPoint - URL de prueba (sandbox)
   * @returns La URL correcta según el modo configurado
   */
  getCheckoutUrl(initPoint: string | undefined, sandboxInitPoint: string | undefined): string {
    if (this.TEST_MODE) {
      if (!sandboxInitPoint) {
        console.warn('⚠️ Modo prueba activo pero no hay sandboxInitPoint. Usando initPoint como fallback.');
        return initPoint || '';
      }
      console.log('🧪 Usando Sandbox Init Point para pruebas');
      return sandboxInitPoint;
    } else {
      if (!initPoint) {
        console.warn('⚠️ Modo producción activo pero no hay initPoint. Usando sandboxInitPoint como fallback.');
        return sandboxInitPoint || '';
      }
      console.log('🏭 Usando Init Point para producción');
      return initPoint;
    }
  }

  /**
   * Verifica si la configuración de Mercado Pago es válida
   * @param initPoint - URL de producción
   * @param sandboxInitPoint - URL de prueba
   * @returns true si hay al menos una URL válida
   */
  isValidConfiguration(initPoint: string | undefined, sandboxInitPoint: string | undefined): boolean {
    const hasValidUrl = Boolean(
      (initPoint && initPoint.trim() !== '') || 
      (sandboxInitPoint && sandboxInitPoint.trim() !== '')
    );
    
    if (!hasValidUrl) {
      console.error('❌ No se recibió ninguna URL válida de Mercado Pago');
    }
    
    return hasValidUrl;
  }

  /**
   * Obtiene información sobre el modo actual
   */
  getMode(): { mode: 'test' | 'production', description: string } {
    return {
      mode: this.TEST_MODE ? 'test' : 'production',
      description: this.TEST_MODE 
        ? 'Modo de prueba (Sandbox) - Usar tarjetas de prueba'
        : 'Modo de producción - Usar tarjetas reales'
    };
  }

  /**
   * Procesa el checkout completo con validación y redirección
   * @param pedidoResponse - Respuesta del pedido con las URLs de MP
   */
  procesarCheckout(pedidoResponse: any): void {
  console.log('🎯🎯🎯 PROCESAR CHECKOUT INICIADO 🎯🎯🎯');
  
  // ✅ VERIFICACIÓN CRÍTICA - FORZAR BACKUP
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('currentUser');
  
  console.log('🔐 ESTADO DE SESIÓN EN PROCESAR CHECKOUT:');
  console.log('   - Token:', !!token);
  console.log('   - UserData:', !!userData);

  if (!token || !userData) {
    console.error('❌❌❌ ERROR CRÍTICO: NO HAY SESIÓN EN PROCESAR CHECKOUT');
    throw new Error('Sesión perdida durante el proceso de pago');
  }

  // ✅ GUARDAR FLAG Y BACKUP (FORZADO)
  console.log('💾 GUARDANDO FLAG Y BACKUP...');
  localStorage.setItem('mercadoPagoRedirect', 'true');
  localStorage.setItem('mercadoPagoTimestamp', Date.now().toString());
  localStorage.setItem('mp_backup_token', token);
  localStorage.setItem('mp_backup_user', userData);
  
  // ✅ VERIFICAR QUE SE GUARDÓ
  const flagGuardado = localStorage.getItem('mercadoPagoRedirect');
  const backupToken = localStorage.getItem('mp_backup_token');
  const backupUser = localStorage.getItem('mp_backup_user');
  
  console.log('✅ Verificación de guardado:');
  console.log('   - Flag:', flagGuardado);
  console.log('   - Backup Token:', !!backupToken);
  console.log('   - Backup User:', !!backupUser);

  // 🔁 Continuar flujo original
  console.log('📦 Procesando checkout con respuesta:', pedidoResponse);
  console.log('📊 Datos completos:', JSON.stringify(pedidoResponse, null, 2));

  const { initPoint, sandboxInitPoint } = pedidoResponse;

  if (!this.isValidConfiguration(initPoint, sandboxInitPoint)) {
    console.error('❌ Error: No hay URLs de pago disponibles');
    console.error('InitPoint:', initPoint);
    console.error('SandboxInitPoint:', sandboxInitPoint);
    throw new Error('No se pudo obtener la URL de pago de Mercado Pago.');
  }

  const checkoutUrl = this.getCheckoutUrl(initPoint, sandboxInitPoint);
  if (!checkoutUrl || checkoutUrl.trim() === '') {
    console.error('❌ URL de checkout vacía después de la selección');
    throw new Error('URL de pago inválida');
  }

  const modeInfo = this.getMode();
  console.log(`🎯 Modo actual: ${modeInfo.mode} - ${modeInfo.description}`);
  console.log('🔗 URL seleccionada:', checkoutUrl);
  console.log('📋 Preference ID:', pedidoResponse.preferenciaIdMp);

  console.log('⏳ Esperando 300ms antes de redirigir...');
  setTimeout(() => {
    try {
      this.redirectToMercadoPago(checkoutUrl);
    } catch (error) {
      console.error('❌ Error en la redirección:', error);
      throw error;
    }
  }, 300);
}


}