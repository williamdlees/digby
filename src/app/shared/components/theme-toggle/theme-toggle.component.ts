import { Component } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { NgClass } from '@angular/common';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button class="theme-toggle-btn" (click)="toggleTheme()" [attr.aria-label]="(isDarkMode$ | async) ? 'Switch to light mode' : 'Switch to dark mode'">
      <i class="fa" [ngClass]="(isDarkMode$ | async) ? 'fa-sun-o' : 'fa-moon-o'"></i>
    </button>
  `,
  styles: [`
    .theme-toggle-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color);
    }
    
    .theme-toggle-btn:hover {
      background-color: var(--hover-bg);
    }
  `],
  imports: [
    NgClass,
    AsyncPipe
  ]
})
export class ThemeToggleComponent {
  isDarkMode$ = this.themeService.isDarkMode$;
  
  constructor(private themeService: ThemeService) {}
  
  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }
}
