import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../services/user-auth.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { DropdownNotificationComponent } from '../notificaciones/dropdown-notification/dropdown-notification.component';
import { FloatingAnimationComponent } from '../extras/floating-animation/floating-animation.component';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, DropdownNotificationComponent, FloatingAnimationComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {

  currentUser: User | null = null;
  isDropdownOpen = false;
  isMenuCollapsed = true;
  carritoCount: number = 0; // ✅ AÑADIR contador del carrito
  isFavoritoHighlighted: boolean = false; // ✅ NUEVO: Estado para resaltar favoritos
  private userSubscription?: Subscription;
  private carritoSubscription?: Subscription; // ✅ AÑADIR
  private favoritoHighlightSubscription?: Subscription; // ✅ NUEVO

  constructor(
    private authService: UserAuthService,
    private router: Router,
    private animationService: AnimationService // ✅ AÑADIR
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios del usuario
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('Navbar - Usuario actualizado:', user);
    });

     // ✅ AÑADIR: Suscribirse al contador del carrito
    this.carritoSubscription = this.animationService.carritoCount$.subscribe(count => {
      this.carritoCount = count;
    });
    // ✅ NUEVO: Suscribirse al resaltado de favoritos
    this.favoritoHighlightSubscription = this.animationService.favoritoHighlight$.subscribe(highlight => {
      this.isFavoritoHighlighted = highlight;
    });

    // Cargar usuario inicial
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.carritoSubscription?.unsubscribe();
    this.favoritoHighlightSubscription?.unsubscribe(); // ✅ NUEVO
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

  closeDropdownAndMenu(): void {
    this.isDropdownOpen = false;
    this.isMenuCollapsed = true;
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    // Cerrar dropdown cuando se cierra el menú móvil
    if (this.isMenuCollapsed) {
      this.isDropdownOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.isMenuCollapsed = true;
    this.isDropdownOpen = false;
    this.router.navigate(['/productlist']);
  }

  navigateToProfile(): void {
    this.isMenuCollapsed = true;
    this.isDropdownOpen = false;
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

  // ✅ AÑADIR: Método para obtener la clase del badge del carrito
  getCarritoBadgeClass(): string {
    return this.carritoCount > 0 ? 'badge bg-danger carrito-badge' : 'badge bg-secondary carrito-badge';
  }

   // ✅ NUEVO: Método para obtener la clase del enlace de favoritos
  getFavoritoClass(): string {
    let baseClass = 'nav-link nav-link-custom';
    
    if (this.isFavoritoHighlighted) {
      baseClass += ' favorito-highlight active'; // Agregar clases de resaltado
    }
    
    return baseClass;
  }

}