import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MercadoPagoService {

  private readonly TEST_MODE = false;

  constructor() { }

  /**
   * ✅ CRÍTICO: Guarda la sesión ANTES de redirigir
   */
  private guardarSesionAntesDePagar(): void {
    console.log('💾 GUARDANDO SESIÓN ANTES DE REDIRIGIR A MP...');
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser');
    
    console.log('📊 Estado actual:', {
      token: !!token,
      userData: !!userData
    });

    if (!token || !userData) {
      console.error('❌ ERROR: No hay sesión para guardar');
      throw new Error('Sesión no encontrada. Por favor, inicia sesión nuevamente.');
    }

    localStorage.setItem('mp_redirect', 'true');
    localStorage.setItem('mp_timestamp', Date.now().toString());
    localStorage.setItem('mp_backup_token', token);
    localStorage.setItem('mp_backup_user', userData);
    
    console.log('✅ Backup de sesión guardado exitosamente');
    console.log('📦 Keys guardadas:', {
      redirect: localStorage.getItem('mp_redirect'),
      timestamp: localStorage.getItem('mp_timestamp'),
      backupToken: !!localStorage.getItem('mp_backup_token'),
      backupUser: !!localStorage.getItem('mp_backup_user')
    });
  }
  redirectToMercadoPago(checkoutUrl: string): void {
    console.log('🚀 INICIANDO REDIRECCIÓN A MERCADO PAGO...');
    
    if (!checkoutUrl || checkoutUrl.trim() === '') {
      throw new Error('URL de pago inválida');
    }

    try {
      this.guardarSesionAntesDePagar();
      
      setTimeout(() => {
        console.log('🔗 Redirigiendo a:', checkoutUrl);
        window.location.href = checkoutUrl;
      }, 300);
      
    } catch (error) {
      console.error('❌ Error en redirección:', error);
      throw error;
    }
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
        console.warn('⚠️ Modo prueba activo pero no hay sandboxInitPoint');
        return initPoint || '';
      }
      console.log('🧪 Usando Sandbox Init Point');
      return sandboxInitPoint;
    } else {
      if (!initPoint) {
        console.warn('⚠️ Modo producción activo pero no hay initPoint');
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
    console.log('🎯 PROCESANDO CHECKOUT...');
    console.log('📦 Pedido Response:', pedidoResponse);

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser');
    
    if (!token || !userData) {
      console.error('❌ ERROR CRÍTICO: No hay sesión activa');
      throw new Error('Debes estar logueado para completar el pago');
    }

    const { initPoint, sandboxInitPoint } = pedidoResponse;

    if (!this.isValidConfiguration(initPoint, sandboxInitPoint)) {
      throw new Error('No se pudo obtener la URL de pago de Mercado Pago.');
    }

    const checkoutUrl = this.getCheckoutUrl(initPoint, sandboxInitPoint);
    if (!checkoutUrl || checkoutUrl.trim() === '') {
      throw new Error('URL de pago inválida');
    }

    const modeInfo = this.getMode();
    console.log(`🎯 Modo: ${modeInfo.mode} - ${modeInfo.description}`);
    console.log('🔗 URL seleccionada:', checkoutUrl);

    this.redirectToMercadoPago(checkoutUrl);
  }
}