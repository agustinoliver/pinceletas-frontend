import { Component } from '@angular/core';
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
export class AppComponent {
  title = 'Pinceletas';
}
