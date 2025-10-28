import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MercadoPagoService {

  // 🧪 Configuración de modo de prueba
  private readonly TEST_MODE = true; // Cambiar a false en producción

  constructor() { }

  /**
   * Redirige al usuario a Mercado Pago Checkout
   * @param checkoutUrl - URL del checkout (initPoint o sandboxInitPoint)
   */
  redirectToMercadoPago(checkoutUrl: string): void {
    if (!checkoutUrl) {
      console.error('❌ No se recibió URL de checkout de Mercado Pago');
      throw new Error('URL de checkout no disponible');
    }

    console.log('🎯 Redirigiendo a Mercado Pago:', checkoutUrl);
    console.log('🧪 Modo de prueba:', this.TEST_MODE ? 'ACTIVADO' : 'DESACTIVADO');

    // ✅ CRÍTICO: Abrir en una nueva pestaña/ventana en lugar de redirigir
    // Esto evita problemas con cookies y storage
    const nuevaVentana = window.open(checkoutUrl, '_blank');
    
    if (!nuevaVentana) {
      // Si el navegador bloqueó el popup, intentar redirección normal
      console.warn('⚠️ Popup bloqueado, usando redirección normal');
      window.location.href = checkoutUrl;
    } else {
      console.log('✅ Mercado Pago abierto en nueva pestaña');
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
    console.log('📦 Procesando checkout con respuesta:', pedidoResponse);
    console.log('📊 Datos completos:', JSON.stringify(pedidoResponse, null, 2));

    const { initPoint, sandboxInitPoint } = pedidoResponse;

    // ✅ CRÍTICO: Validar que tengamos al menos una URL
    if (!this.isValidConfiguration(initPoint, sandboxInitPoint)) {
      console.error('❌ Error: No hay URLs de pago disponibles');
      console.error('InitPoint:', initPoint);
      console.error('SandboxInitPoint:', sandboxInitPoint);
      throw new Error('No se pudo obtener la URL de pago de Mercado Pago. Por favor, contacta a soporte.');
    }

    // Obtener la URL correcta según el modo
    const checkoutUrl = this.getCheckoutUrl(initPoint, sandboxInitPoint);

    if (!checkoutUrl || checkoutUrl.trim() === '') {
      console.error('❌ URL de checkout vacía después de la selección');
      throw new Error('URL de pago inválida');
    }

    // Log de información
    const modeInfo = this.getMode();
    console.log(`🎯 Modo actual: ${modeInfo.mode} - ${modeInfo.description}`);
    console.log('🔗 URL seleccionada:', checkoutUrl);
    console.log('📋 Preference ID:', pedidoResponse.preferenciaIdMp);

    // ✅ MEJORADO: Delay más corto y con mejor manejo
    console.log('⏳ Esperando 300ms antes de redirigir...');
    
    setTimeout(() => {
      try {
        this.redirectToMercadoPago(checkoutUrl);
      } catch (error) {
        console.error('❌ Error en la redirección:', error);
        throw error;
      }
    }, 300); // Reducido de 500ms a 300ms
  }
}