import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../services/user-auth.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  currentUser: User | null = null;
  isMenuCollapsed = true;
  private userSubscription?: Subscription;
  private dropdown: any;

  constructor(
    private authService: UserAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios del usuario
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      // Re-inicializar dropdown cuando cambia el usuario
      setTimeout(() => this.initializeDropdown(), 100);
    });
  }

  ngAfterViewInit(): void {
    // Inicializar dropdown de Bootstrap
    this.initializeDropdown();
  }

  ngOnDestroy(): void {
    // Limpiar suscripción
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    // Limpiar dropdown
    if (this.dropdown) {
      this.dropdown.dispose();
    }
  }

  private initializeDropdown(): void {
    const dropdownElement = document.getElementById('navbarDropdown');
    if (dropdownElement && typeof bootstrap !== 'undefined') {
      // Limpiar dropdown anterior si existe
      if (this.dropdown) {
        this.dropdown.dispose();
      }
      // Crear nuevo dropdown
      this.dropdown = new bootstrap.Dropdown(dropdownElement);
    }
  }

  logout(): void {
    // Cerrar dropdown si está abierto
    if (this.dropdown) {
      this.dropdown.hide();
    }
    this.authService.logout();
    this.isMenuCollapsed = true;
    this.router.navigate(['/login']);
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  navigateToProfile(): void {
    // Cerrar dropdown si está abierto
    if (this.dropdown) {
      this.dropdown.hide();
    }
    this.isMenuCollapsed = true;
    this.router.navigate(['/profile']);
  }

  get isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  get userName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.nombre} ${this.currentUser.apellido}`;
  }
}
