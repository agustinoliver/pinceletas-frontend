import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AnimationData {
  type: 'favorito' | 'carrito';
  productId: number;
  productName: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private carritoCount = new BehaviorSubject<number>(0);
  private animationTrigger = new BehaviorSubject<AnimationData | null>(null);
  private favoritoHighlight = new BehaviorSubject<boolean>(false); // ✅ NUEVO: Para resaltar favoritos

  carritoCount$ = this.carritoCount.asObservable();
  animationTrigger$ = this.animationTrigger.asObservable();
  favoritoHighlight$ = this.favoritoHighlight.asObservable(); // ✅ NUEVO

  // Método para agregar producto al carrito con animación
  agregarAlCarrito(productId: number, productName: string, imageUrl?: string): void {
    const currentCount = this.carritoCount.value;
    this.carritoCount.next(currentCount + 1);
    
    this.animationTrigger.next({
      type: 'carrito',
      productId,
      productName,
      imageUrl
    });
  }

  // Método para agregar a favoritos con animación
  agregarAFavoritos(productId: number, productName: string, imageUrl?: string): void {
    this.animationTrigger.next({
      type: 'favorito',
      productId,
      productName,
      imageUrl
    });

    // ✅ NUEVO: Activar resaltado del favorito por 2 segundos
    this.favoritoHighlight.next(true);
    setTimeout(() => {
      this.favoritoHighlight.next(false);
    }, 2000);
  }

  setCarritoCount(count: number): void {
    this.carritoCount.next(count);
  }

  resetCarritoCount(): void {
    this.carritoCount.next(0);
  }

   decrementarCarritoCount(): void {
    const currentCount = this.carritoCount.value;
    if (currentCount > 0) {
      this.carritoCount.next(currentCount - 1);
    }
  }
}