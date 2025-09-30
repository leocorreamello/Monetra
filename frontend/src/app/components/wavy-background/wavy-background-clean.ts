import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wavy-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wavy-container" [ngClass]="containerClassName">
      <div class="waves-background">
        <div class="wave wave1"></div>
        <div class="wave wave2"></div>
        <div class="wave wave3"></div>
        <div class="wave wave4"></div>
        <div class="wave wave5"></div>
      </div>
      <div class="wavy-content" [ngClass]="className">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .wavy-container {
      position: relative;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    }
    
    .waves-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    
    .wave {
      position: absolute;
      top: 50%;
      left: -100%;
      width: 200%;
      height: 200px;
      border-radius: 50%;
      opacity: 0.3;
      transform: translateY(-50%);
    }
    
    .wave1 {
      background: linear-gradient(45deg, #3b82f6, transparent);
      animation: wave 8s ease-in-out infinite;
      animation-delay: 0s;
    }
    
    .wave2 {
      background: linear-gradient(45deg, #8b5cf6, transparent);
      animation: wave 12s ease-in-out infinite;
      animation-delay: -2s;
    }
    
    .wave3 {
      background: linear-gradient(45deg, #ec4899, transparent);
      animation: wave 10s ease-in-out infinite;
      animation-delay: -4s;
    }
    
    .wave4 {
      background: linear-gradient(45deg, #06b6d4, transparent);
      animation: wave 14s ease-in-out infinite;
      animation-delay: -6s;
    }
    
    .wave5 {
      background: linear-gradient(45deg, #10b981, transparent);
      animation: wave 16s ease-in-out infinite;
      animation-delay: -8s;
    }
    
    @keyframes wave {
      0%, 100% {
        transform: translateY(-50%) translateX(-50%) rotate(0deg);
      }
      50% {
        transform: translateY(-60%) translateX(-30%) rotate(180deg);
      }
    }
    
    .wavy-content {
      position: relative;
      z-index: 10;
      text-align: center;
    }
  `]
})
export class WavyBackgroundComponent {
  @Input() className?: string;
  @Input() containerClassName?: string;
}