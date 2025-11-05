const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://navy-library-jaguar-elsewhere.trycloudflare.com';
};

export const mercadoPagoEnvironment = {
  testMode: false,
  
  successUrl: `${getBaseUrl()}/payment/success`,
  failureUrl: `${getBaseUrl()}/payment/failure`,
  pendingUrl: `${getBaseUrl()}/payment/pending`,
  
  publicKey: {
    test: 'TEST-...',
    prod: 'APP_USR-81186e79-747d-4fbd-9b39-d254a65acda4'
  }
};

console.log('🔗 Mercado Pago URLs configuradas:');
console.log('   - Base URL:', getBaseUrl());
console.log('   - Success:', mercadoPagoEnvironment.successUrl);
console.log('   - Failure:', mercadoPagoEnvironment.failureUrl);
console.log('   - Pending:', mercadoPagoEnvironment.pendingUrl);
