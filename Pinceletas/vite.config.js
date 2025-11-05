import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

// Configuración de Vite
export default defineConfig({
  plugins: [angular()],
  server: {
    port: 4200,
    host: '0.0.0.0', // ✅ Escucha en todas las interfaces
    strictPort: false,
    hmr: {
      clientPort: 4200
    },
    // // ✅ CRÍTICO: Permitir todos los hosts
    // allowedHosts: [
    //   'localhost',
    //   '127.0.0.1',
    //   '.trycloudflare.com',
    //   'jose-further-convergence-quarterly.trycloudflare.com'
    // ],
    // ✅ ESTA ES LA MEJOR OPCIÓN:
    allowedHosts: 'all'
  }
});
