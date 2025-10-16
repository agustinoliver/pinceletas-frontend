import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../services/user-auth.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { DropdownNotificationComponent } from '../notificaciones/dropdown-notification/dropdown-notification.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, DropdownNotificationComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isDropdownOpen = false;
  private userSubscription?: Subscription;

  constructor(
    private authService: UserAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios del usuario
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('Navbar - Usuario actualizado:', user);
    });

    // Cargar usuario inicial
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // Escuchar clics fuera del dropdown para cerrarlo
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.dropdown');
    
    if (!clickedInside && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/productlist']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get userName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.nombre} ${this.currentUser.apellido}`;
  }
}