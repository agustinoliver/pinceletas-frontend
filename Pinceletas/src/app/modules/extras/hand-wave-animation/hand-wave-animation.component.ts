// hand-wave-animation.component.ts - OPCIÓN A
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hand-wave-animation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showAnimation" 
         class="hand-wave-container water-effect"
         [class.hidden]="!showAnimation">
      <div class="hand-wave-animation">
        <div class="water-ripple" *ngFor="let ripple of ripples" 
             [style]="ripple"></div>
        <div class="water-hand">👋</div>
      </div>
      <div class="hand-wave-message glass-text">
        <div class="message-content">
          {{ currentMessage }}
        </div>
        <div class="glass-reflection"></div>
      </div>
    </div>
  `,
  styles: [`
    .hand-wave-container.water-effect {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 15px;
      z-index: 10001;
      animation: waterAppear 0.7s ease-out;
    }

    .hand-wave-animation {
      background: transparent;
      width: 75px;
      height: 75px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      position: relative;
    }

    .water-ripple {
      position: absolute;
      border: 2px solid rgba(102, 126, 234, 0.3);
      border-radius: 50%;
      animation: rippleExpand 2.5s ease-out infinite;
    }

    .water-hand {
      font-size: 36px;
      z-index: 3;
      position: relative;
      animation: waterWave 2s ease-in-out infinite;
      filter: 
        drop-shadow(0 0 10px rgba(102, 126, 234, 0.4))
        drop-shadow(0 4px 8px rgba(0,0,0,0.2));
    }

    /* Estilo de texto - Holográfico */
    .hand-wave-message {
      background: linear-gradient(135deg, 
        rgba(102, 126, 234, 0.1) 0%, 
        rgba(118, 75, 162, 0.1) 50%, 
        rgba(102, 126, 234, 0.05) 100%);
      color: #1a1a1aff;
      padding: 17px 21px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      max-width: 240px;
      box-shadow: 
        0 0 0 1px rgba(102, 126, 234, 0.3),
        0 8px 32px rgba(0,0,0,0.3),
        inset 0 1px 0 rgba(255,255,255,0.2);
      border: 1px solid rgba(102, 126, 234, 0.5);
      backdrop-filter: blur(25px);
      line-height: 1.5;
      position: relative;
      overflow: hidden;
      animation: hologramPulse 4s ease-in-out infinite;
    }

    .hand-wave-message::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, 
        transparent, 
        rgba(255,255,255,0.1), 
        transparent);
      animation: hologramScan 3s ease-in-out infinite;
    }

    .hand-wave-message::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid rgba(102, 126, 234, 0.3);
      backdrop-filter: blur(25px);
    }

    .hidden {
      display: none !important;
    }

    /* Animaciones de Agua (mantenidas) */
    @keyframes waterWave {
      0%, 100% { 
        transform: rotate(0deg) scale(1) translateY(0);
      }
      25% { 
        transform: rotate(-15deg) scale(1.1) translateY(-2px);
      }
      50% { 
        transform: rotate(10deg) scale(1.05) translateY(1px);
      }
      75% { 
        transform: rotate(-5deg) scale(1.08) translateY(-1px);
      }
    }

    @keyframes rippleExpand {
      0% {
        width: 20px;
        height: 20px;
        opacity: 1;
      }
      100% {
        width: 100px;
        height: 100px;
        opacity: 0;
      }
    }

    @keyframes waterAppear {
      0% {
        opacity: 0;
        transform: translateX(-50%) scale(0.8);
        filter: blur(10px);
      }
      100% {
        opacity: 1;
        transform: translateX(-50%) scale(1);
        filter: blur(0);
      }
    }

    /* Nuevas animaciones para el texto */
    @keyframes hologramPulse {
      0%, 100% { 
        box-shadow: 
          0 0 0 1px rgba(102, 126, 234, 0.3),
          0 8px 32px rgba(0,0,0,0.3),
          inset 0 1px 0 rgba(255,255,255,0.2);
      }
      50% { 
        box-shadow: 
          0 0 0 1px rgba(102, 126, 234, 0.6),
          0 12px 40px rgba(102, 126, 234, 0.4),
          inset 0 1px 0 rgba(255,255,255,0.3);
      }
    }

    @keyframes hologramScan {
      0% {
        left: -100%;
      }
      100% {
        left: 100%;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hand-wave-container.water-effect {
        margin-bottom: 10px;
      }

      .hand-wave-animation {
        width: 65px;
        height: 65px;
      }

      .water-hand {
        font-size: 30px;
      }

      .hand-wave-message {
        font-size: 13px;
        max-width: 200px;
        padding: 15px 17px;
      }
    }
  `]
})
export class HandWaveAnimationComponent implements OnInit, OnDestroy {
  @Input() messages: string[] = [];
  @Input() interval: number = 15000;
  
  showAnimation = false;
  currentMessage = '';
  ripples: any[] = [];
  private animationInterval: any;
  private messageIndex = 0;

  ngOnInit(): void {
    this.generateRipples();
    this.startAnimationCycle();
  }

  ngOnDestroy(): void {
    this.stopAnimationCycle();
  }

  private generateRipples(): void {
    this.ripples = Array.from({ length: 3 }, (_, i) => ({
      animationDelay: `${i * 0.8}s`
    }));
  }

  private startAnimationCycle(): void {
    setTimeout(() => {
      this.showNextAnimation();
    }, 3500);

    this.animationInterval = setInterval(() => {
      this.showNextAnimation();
    }, this.interval);
  }

  private stopAnimationCycle(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }

  private showNextAnimation(): void {
    if (this.messages.length === 0) return;

    this.currentMessage = this.messages[this.messageIndex];
    this.messageIndex = (this.messageIndex + 1) % this.messages.length;
    this.showAnimation = true;

    setTimeout(() => {
      this.showAnimation = false;
    }, 6500);
  }

  triggerAnimation(message?: string): void {
    if (message) {
      this.currentMessage = message;
    } else if (this.messages.length > 0) {
      this.currentMessage = this.messages[this.messageIndex];
      this.messageIndex = (this.messageIndex + 1) % this.messages.length;
    }
    
    this.showAnimation = true;
    
    setTimeout(() => {
      this.showAnimation = false;
    }, 6500);
  }
}