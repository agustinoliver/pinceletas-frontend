import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './modules/navbar/navbar.component';
import { GoogleChartsModule } from 'angular-google-charts';
import { FooterComponent } from './modules/dashboard/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, GoogleChartsModule, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `
})
export class AppComponent implements OnInit {
  title = 'Pinceletas';

  ngOnInit(): void {
    this.limpiarBackupsAntiguos();
  }

  private limpiarBackupsAntiguos(): void {
    const timestamp = localStorage.getItem('mercadoPagoTimestamp');
    if (timestamp) {
      const ahora = Date.now();
      const tiempoTranscurrido = ahora - parseInt(timestamp);
      
      // Si pasaron más de 30 minutos, limpiar
      if (tiempoTranscurrido > 30 * 60 * 1000) {
        localStorage.removeItem('mercadoPagoRedirect');
        localStorage.removeItem('mercadoPagoTimestamp');
        localStorage.removeItem('mp_backup_token');
        localStorage.removeItem('mp_backup_user');
        console.log('🧹 Backups antiguos de Mercado Pago limpiados');
      } else {
        console.log('⏰ Backup de Mercado Pago aún válido');
      }
    }
    
    // También limpiar cualquier backup muy viejo (más de 24 horas)
    this.limpiarBackupsMuyAntiguos();
  }

  private limpiarBackupsMuyAntiguos(): void {
    const keysToCheck = [
      'mercadoPagoRedirect',
      'mercadoPagoTimestamp', 
      'mp_backup_token',
      'mp_backup_user'
    ];
    
    let backupsLimpios = 0;
    
    keysToCheck.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        // Si es un timestamp, verificar antigüedad
        if (key === 'mercadoPagoTimestamp') {
          const timestamp = parseInt(item);
          const ahora = Date.now();
          const tiempoTranscurrido = ahora - timestamp;
          
          // Si tiene más de 24 horas, limpiar
          if (tiempoTranscurrido > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('mercadoPagoRedirect');
            localStorage.removeItem('mercadoPagoTimestamp');
            localStorage.removeItem('mp_backup_token');
            localStorage.removeItem('mp_backup_user');
            backupsLimpios++;
          }
        }
      }
    });
    
    if (backupsLimpios > 0) {
      console.log(`🧹 ${backupsLimpios} backups muy antiguos limpiados`);
    }
  }
}