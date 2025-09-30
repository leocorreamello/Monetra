import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WavyBackgroundComponent } from '../components/wavy-background/wavy-background';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, WavyBackgroundComponent],
  templateUrl: './home-v2.html',
  styleUrls: ['./home-v2.css']
})
export class HomeComponent {
  constructor() { }
  
  goToPlanilhas() {
    // Encontrar e clicar no botão de planilhas da navegação
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(button => {
      const text = button.textContent?.toLowerCase();
      if (text?.includes('planilhas')) {
        (button as HTMLElement).click();
      }
    });
  }
}