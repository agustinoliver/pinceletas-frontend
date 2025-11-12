import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AnimationData, AnimationService } from '../../../services/animation.service';


@Component({
  selector: 'app-floating-animation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngFor="let animation of activeAnimations" 
         [class]="animation.class"
         [style]="animation.style"
         class="floating-element">
      <img *ngIf="animation.data.imageUrl" [src]="animation.data.imageUrl" class="animation-image">
      <i *ngIf="!animation.data.imageUrl" [class]="getIcon(animation.data.type)"></i>
    </div>
  `,
  styles: [`
    .floating-element {
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }

  .animation-image {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }

  .to-favorito {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    color: white;
    width: 45px;
    height: 45px;
    border: 3px solid white;
  }

  .to-carrito {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    width: 45px;
    height: 45px;
    border: 3px solid white;
  }
  `]
})
export class FloatingAnimationComponent implements OnInit, OnDestroy {
  activeAnimations: Array<{data: AnimationData, class: string, style: any}> = [];
  private subscription?: Subscription;

  constructor(private animationService: AnimationService) {}

  ngOnInit(): void {
    this.subscription = this.animationService.animationTrigger$.subscribe(data => {
      if (data) {
        this.startAnimation(data);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  startAnimation(data: AnimationData): void {
    // Crear elemento de animación
    const animationElement = {
      data,
      class: data.type === 'carrito' ? 'to-carrito' : 'to-favorito',
      style: this.getInitialStyle()
    };

    this.activeAnimations.push(animationElement);

    // Iniciar animación después de un pequeño delay
    setTimeout(() => {
      this.animateToTarget(animationElement, data.type);
    }, 50);

    // Remover animación después de completarse
    setTimeout(() => {
      this.activeAnimations = this.activeAnimations.filter(anim => anim !== animationElement);
    }, 1000);
  }

  private getInitialStyle(): any {
    // Posición inicial (centro de la pantalla)
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: '1'
    };
  }

  private animateToTarget(animationElement: any, type: 'favorito' | 'carrito'): void {
  // Posiciones fijas en la parte superior derecha de la pantalla
  const targetPosition = type === 'carrito' 
    ? { left: 'calc(100% - 100px)', top: '20px' }  // Más a la derecha para carrito
    : { left: 'calc(100% - 150px)', top: '20px' }; // Un poco más a la izquierda para favoritos

  animationElement.style = {
    left: targetPosition.left,
    top: targetPosition.top,
    transform: 'scale(0.3)',
    opacity: '0'
  };
}

  getIcon(type: 'favorito' | 'carrito'): string {
    return type === 'carrito' ? 'fas fa-shopping-cart' : 'fas fa-heart';
  }

  
}