import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wavy-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wavy-container" [ngClass]="containerClassName">
      <div class="waves-background">
        <!-- Ondas SVG verdadeiramente onduladas -->
        <svg class="wave-svg wave-svg1" viewBox="0 0 1200 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgba(96, 165, 250, 0);stop-opacity:0" />
              <stop offset="50%" style="stop-color:rgba(96, 165, 250, 0.9);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(96, 165, 250, 0);stop-opacity:0" />
            </linearGradient>
          </defs>
          <path class="wave-path1" fill="url(#grad1)" d="M0,160 C300,100 600,220 900,160 C1050,120 1150,180 1200,160 L1200,320 L0,320 Z">
          </path>
        </svg>

        <svg class="wave-svg wave-svg2" viewBox="0 0 1200 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgba(168, 85, 247, 0);stop-opacity:0" />
              <stop offset="50%" style="stop-color:rgba(168, 85, 247, 0.85);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(168, 85, 247, 0);stop-opacity:0" />
            </linearGradient>
          </defs>
          <path class="wave-path2" fill="url(#grad2)" d="M0,200 C250,140 550,260 800,200 C950,160 1100,220 1200,200 L1200,320 L0,320 Z">
          </path>
        </svg>

        <svg class="wave-svg wave-svg3" viewBox="0 0 1200 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgba(244, 114, 182, 0);stop-opacity:0" />
              <stop offset="50%" style="stop-color:rgba(244, 114, 182, 0.8);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(244, 114, 182, 0);stop-opacity:0" />
            </linearGradient>
          </defs>
          <path class="wave-path3" fill="url(#grad3)" d="M0,240 C200,180 500,300 700,240 C850,200 1000,260 1200,240 L1200,320 L0,320 Z">
          </path>
        </svg>

        <svg class="wave-svg wave-svg4" viewBox="0 0 1200 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgba(34, 211, 238, 0);stop-opacity:0" />
              <stop offset="50%" style="stop-color:rgba(34, 211, 238, 0.75);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(34, 211, 238, 0);stop-opacity:0" />
            </linearGradient>
          </defs>
          <path class="wave-path4" fill="url(#grad4)" d="M0,120 C350,60 650,180 1000,120 C1100,100 1150,140 1200,120 L1200,320 L0,320 Z">
          </path>
        </svg>

        <svg class="wave-svg wave-svg5" viewBox="0 0 1200 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgba(52, 211, 153, 0);stop-opacity:0" />
              <stop offset="50%" style="stop-color:rgba(52, 211, 153, 0.7);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(52, 211, 153, 0);stop-opacity:0" />
            </linearGradient>
          </defs>
          <path class="wave-path5" fill="url(#grad5)" d="M0,280 C300,220 600,340 900,280 C1050,240 1150,300 1200,280 L1200,320 L0,320 Z">
          </path>
        </svg>
        
        <!-- Partículas brilhantes -->
        <div class="particles">
          <div class="particle particle1"></div>
          <div class="particle particle2"></div>
          <div class="particle particle3"></div>
          <div class="particle particle4"></div>
          <div class="particle particle5"></div>
          <div class="particle particle6"></div>
        </div>
      </div>
      <div class="wavy-content" [ngClass]="className">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .wavy-container {
      position: relative;
      min-height: 100vh; /* MUDANÇA: usar min-height para se estender completamente */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: linear-gradient(135deg, #020617 0%, #0c0a1e 50%, #0f172a 100%);
    }
    
    .waves-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    
    /* Ondas SVG fluidas */
    .wave-svg {
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      bottom: 0;
    }
    
    .wave-svg1 {
      bottom: -20%;
      animation: wave-move1 12s ease-in-out infinite;
    }
    
    .wave-svg2 {
      bottom: -25%;
      animation: wave-move2 15s ease-in-out infinite;
      animation-delay: -2s;
    }
    
    .wave-svg3 {
      bottom: -30%;
      animation: wave-move3 18s ease-in-out infinite;
      animation-delay: -4s;
    }
    
    .wave-svg4 {
      bottom: -15%;
      animation: wave-move4 14s ease-in-out infinite;
      animation-delay: -6s;
    }
    
    .wave-svg5 {
      bottom: -35%;
      animation: wave-move5 20s ease-in-out infinite;
      animation-delay: -8s;
    }
    
    /* Animações das ondas com movimento lateral */
    @keyframes wave-move1 {
      0%, 100% {
        transform: translateX(-5%) scale(1);
      }
      50% {
        transform: translateX(5%) scale(1.02);
      }
    }
    
    @keyframes wave-move2 {
      0%, 100% {
        transform: translateX(3%) scale(1.01);
      }
      50% {
        transform: translateX(-7%) scale(0.98);
      }
    }
    
    @keyframes wave-move3 {
      0%, 100% {
        transform: translateX(-8%) scale(0.99);
      }
      50% {
        transform: translateX(4%) scale(1.03);
      }
    }
    
    @keyframes wave-move4 {
      0%, 100% {
        transform: translateX(6%) scale(1.01);
      }
      50% {
        transform: translateX(-3%) scale(0.97);
      }
    }
    
    @keyframes wave-move5 {
      0%, 100% {
        transform: translateX(-4%) scale(1);
      }
      50% {
        transform: translateX(8%) scale(1.04);
      }
    }
    
    /* Animações dos caminhos SVG para ondulação */
    .wave-path1 {
      animation: wave-morph1 8s ease-in-out infinite;
    }
    
    .wave-path2 {
      animation: wave-morph2 10s ease-in-out infinite;
      animation-delay: -1s;
    }
    
    .wave-path3 {
      animation: wave-morph3 12s ease-in-out infinite;
      animation-delay: -2s;
    }
    
    .wave-path4 {
      animation: wave-morph4 9s ease-in-out infinite;
      animation-delay: -3s;
    }
    
    .wave-path5 {
      animation: wave-morph5 11s ease-in-out infinite;
      animation-delay: -4s;
    }
    
    @keyframes wave-morph1 {
      0%, 100% {
        d: path("M0,160 C300,100 600,220 900,160 C1050,120 1150,180 1200,160 L1200,320 L0,320 Z");
      }
      25% {
        d: path("M0,180 C300,120 600,240 900,180 C1050,140 1150,200 1200,180 L1200,320 L0,320 Z");
      }
      50% {
        d: path("M0,140 C300,80 600,200 900,140 C1050,100 1150,160 1200,140 L1200,320 L0,320 Z");
      }
      75% {
        d: path("M0,170 C300,110 600,230 900,170 C1050,130 1150,190 1200,170 L1200,320 L0,320 Z");
      }
    }
    
    @keyframes wave-morph2 {
      0%, 100% {
        d: path("M0,200 C250,140 550,260 800,200 C950,160 1100,220 1200,200 L1200,320 L0,320 Z");
      }
      33% {
        d: path("M0,220 C250,160 550,280 800,220 C950,180 1100,240 1200,220 L1200,320 L0,320 Z");
      }
      66% {
        d: path("M0,180 C250,120 550,240 800,180 C950,140 1100,200 1200,180 L1200,320 L0,320 Z");
      }
    }
    
    @keyframes wave-morph3 {
      0%, 100% {
        d: path("M0,240 C200,180 500,300 700,240 C850,200 1000,260 1200,240 L1200,320 L0,320 Z");
      }
      40% {
        d: path("M0,260 C200,200 500,320 700,260 C850,220 1000,280 1200,260 L1200,320 L0,320 Z");
      }
      80% {
        d: path("M0,220 C200,160 500,280 700,220 C850,180 1000,240 1200,220 L1200,320 L0,320 Z");
      }
    }
    
    @keyframes wave-morph4 {
      0%, 100% {
        d: path("M0,120 C350,60 650,180 1000,120 C1100,100 1150,140 1200,120 L1200,320 L0,320 Z");
      }
      50% {
        d: path("M0,140 C350,80 650,200 1000,140 C1100,120 1150,160 1200,140 L1200,320 L0,320 Z");
      }
    }
    
    @keyframes wave-morph5 {
      0%, 100% {
        d: path("M0,280 C300,220 600,340 900,280 C1050,240 1150,300 1200,280 L1200,320 L0,320 Z");
      }
      20% {
        d: path("M0,300 C300,240 600,360 900,300 C1050,260 1150,320 1200,300 L1200,320 L0,320 Z");
      }
      40% {
        d: path("M0,260 C300,200 600,320 900,260 C1050,220 1150,280 1200,260 L1200,320 L0,320 Z");
      }
      60% {
        d: path("M0,290 C300,230 600,350 900,290 C1050,250 1150,310 1200,290 L1200,320 L0,320 Z");
      }
      80% {
        d: path("M0,270 C300,210 600,330 900,270 C1050,230 1150,290 1200,270 L1200,320 L0,320 Z");
      }
    }
    
    .wavy-content {
      position: relative;
      z-index: 10;
      text-align: center;
      max-width: 800px;
      padding: 0 20px;
    }
    
    /* Partículas brilhantes */
    .particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    
    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
      border-radius: 50%;
      animation-timing-function: ease-in-out;
      animation-iteration-count: infinite;
    }
    
    .particle1 {
      top: 20%;
      left: 10%;
      animation: float-particle 8s infinite;
      animation-delay: 0s;
      box-shadow: 0 0 15px rgba(96, 165, 250, 0.9), 0 0 30px rgba(96, 165, 250, 0.4);
    }
    
    .particle2 {
      top: 60%;
      left: 80%;
      animation: float-particle 12s infinite;
      animation-delay: -2s;
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.9), 0 0 30px rgba(168, 85, 247, 0.4);
    }
    
    .particle3 {
      top: 30%;
      left: 60%;
      animation: float-particle 10s infinite;
      animation-delay: -4s;
      box-shadow: 0 0 15px rgba(244, 114, 182, 0.9), 0 0 30px rgba(244, 114, 182, 0.4);
    }
    
    .particle4 {
      top: 80%;
      left: 20%;
      animation: float-particle 15s infinite;
      animation-delay: -6s;
      box-shadow: 0 0 15px rgba(34, 211, 238, 0.9), 0 0 30px rgba(34, 211, 238, 0.4);
    }
    
    .particle5 {
      top: 40%;
      left: 90%;
      animation: float-particle 11s infinite;
      animation-delay: -8s;
      box-shadow: 0 0 15px rgba(52, 211, 153, 0.9), 0 0 30px rgba(52, 211, 153, 0.4);
    }
    
    .particle6 {
      top: 70%;
      left: 40%;
      animation: float-particle 13s infinite;
      animation-delay: -10s;
      box-shadow: 0 0 15px rgba(248, 113, 113, 0.9), 0 0 30px rgba(248, 113, 113, 0.4);
    }
    
    @keyframes float-particle {
      0%, 100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.6;
      }
      25% {
        transform: translate(-30px, -20px) scale(1.2);
        opacity: 1;
      }
      50% {
        transform: translate(20px, -40px) scale(0.8);
        opacity: 0.8;
      }
      75% {
        transform: translate(-10px, -10px) scale(1.1);
        opacity: 1;
      }
    }
    
    /* Efeito de brilho pulsante no container */
    .wavy-container::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 50%, 
        rgba(59, 130, 246, 0.03) 0%, 
        transparent 50%);
      animation: pulse-glow 6s ease-in-out infinite;
      pointer-events: none;
      z-index: 2;
    }
    
    @keyframes pulse-glow {
      0%, 100% {
        opacity: 0.3;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.05);
      }
    }

    /* =================================
       RESPONSIVIDADE COMPLETA WAVY BACKGROUND
       ================================= */

    /* Extra Small devices (320px - 575px) - Smartphones pequenos */
    @media (max-width: 575.98px) {
      .wavy-container {
        height: calc(100vh - 55px);
      }
      
      .wave-svg {
        height: 70%;
        opacity: 0.7;
      }
      
      .wave-svg1 {
        bottom: -15%;
        animation-duration: 10s;
      }
      
      .wave-svg2 {
        bottom: -20%;
        animation-duration: 12s;
      }
      
      .wave-svg3 {
        bottom: -25%;
        animation-duration: 14s;
      }
      
      .wave-svg4 {
        bottom: -10%;
        animation-duration: 11s;
      }
      
      .wave-svg5 {
        bottom: -30%;
        animation-duration: 16s;
      }
      
      .particle {
        width: 1.5px;
        height: 1.5px;
        opacity: 0.6;
      }
      
      .floating-element {
        transform: scale(0.7);
        animation-duration: 20s;
      }
    }

    /* Small devices (576px - 767px) - Smartphones grandes */
    @media (min-width: 576px) and (max-width: 767.98px) {
      .wavy-container {
        height: calc(100vh - 60px);
      }
      
      .wave-svg {
        height: 75%;
        opacity: 0.8;
      }
      
      .wave-svg1 {
        bottom: -18%;
      }
      
      .wave-svg2 {
        bottom: -22%;
      }
      
      .wave-svg3 {
        bottom: -27%;
      }
      
      .wave-svg4 {
        bottom: -12%;
      }
      
      .wave-svg5 {
        bottom: -32%;
      }
      
      .particle {
        width: 2px;
        height: 2px;
        opacity: 0.7;
      }
      
      .floating-element {
        transform: scale(0.8);
      }
    }

    /* Medium devices (768px - 1023px) - Tablets */
    @media (min-width: 768px) and (max-width: 1023.98px) {
      .wavy-container {
        height: calc(100vh - 65px);
      }
      
      .wave-svg {
        height: 85%;
        opacity: 0.85;
      }
      
      .particle {
        width: 2.5px;
        height: 2.5px;
        opacity: 0.75;
      }
      
      .floating-element {
        transform: scale(0.9);
      }
    }

    /* Large devices (1024px - 1439px) - Desktop pequeno */
    @media (min-width: 1024px) and (max-width: 1439.98px) {
      .wavy-container {
        height: calc(100vh - 70px);
      }
      
      .wave-svg {
        height: 90%;
        opacity: 0.9;
      }
      
      .particle {
        width: 3px;
        height: 3px;
        opacity: 0.8;
      }
    }

    /* Extra Large devices (1440px - 1919px) - Desktop grande */
    @media (min-width: 1440px) and (max-width: 1919.98px) {
      .wavy-container {
        height: calc(100vh - 70px);
      }
      
      .wave-svg {
        height: 95%;
        opacity: 0.95;
      }
      
      .wave-svg1 {
        bottom: -20%;
        animation-duration: 12s;
      }
      
      .wave-svg2 {
        bottom: -25%;
        animation-duration: 15s;
      }
      
      .wave-svg3 {
        bottom: -30%;
        animation-duration: 18s;
      }
      
      .wave-svg4 {
        bottom: -15%;
        animation-duration: 14s;
      }
      
      .wave-svg5 {
        bottom: -35%;
        animation-duration: 20s;
      }
      
      .particle {
        width: 3.5px;
        height: 3.5px;
        opacity: 0.85;
      }
    }

    /* Extra Extra Large devices (1920px+) - TVs e monitores grandes */
    @media (min-width: 1920px) {
      .wavy-container {
        height: calc(100vh - 80px);
      }
      
      .wave-svg {
        height: 100%;
        opacity: 1;
      }
      
      .wave-svg1 {
        bottom: -25%;
        animation-duration: 14s;
      }
      
      .wave-svg2 {
        bottom: -30%;
        animation-duration: 17s;
      }
      
      .wave-svg3 {
        bottom: -35%;
        animation-duration: 20s;
      }
      
      .wave-svg4 {
        bottom: -20%;
        animation-duration: 16s;
      }
      
      .wave-svg5 {
        bottom: -40%;
        animation-duration: 22s;
      }
      
      .particle {
        width: 4px;
        height: 4px;
        opacity: 0.9;
      }
      
      .floating-element {
        transform: scale(1.2);
        animation-duration: 30s;
      }
      
      /* Adicionar mais detalhes visuais em telas grandes */
      .waves-background::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(ellipse at center, rgba(96, 165, 250, 0.1) 0%, transparent 70%);
        pointer-events: none;
        z-index: 2;
      }
      
      .waves-background::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
          radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(244, 114, 182, 0.06) 0%, transparent 50%);
        pointer-events: none;
        z-index: 2;
        animation: backgroundPulse 25s ease-in-out infinite;
      }
      
      @keyframes backgroundPulse {
        0%, 100% {
          opacity: 0.5;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.05);
        }
      }
    }
  `]
})
export class WavyBackgroundComponent {
  @Input() className?: string;
  @Input() containerClassName?: string;
}