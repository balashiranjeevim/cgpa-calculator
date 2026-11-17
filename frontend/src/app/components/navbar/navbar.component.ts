import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar">
      <div class="navbar-container">
        <a routerLink="/dashboard" class="brand">
          <div class="brand-symbol">&#9632;</div>
          <div class="brand-text">
            <span class="brand-title">CGPA CALCULATOR</span>
            <span class="brand-subtitle">Academic Records</span>
          </div>
        </a>

        <!-- Desktop Navigation -->
        <nav class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
            Dashboard
          </a>
          <a routerLink="/history" routerLinkActive="active" class="nav-link">
            Saved History
          </a>
        </nav>

        <!-- Mobile Menu Toggle Button -->
        <button class="mobile-toggle" (click)="toggleMobileMenu()" [attr.aria-expanded]="mobileMenuOpen" aria-label="Toggle Navigation">
          <svg *ngIf="!mobileMenuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <svg *ngIf="mobileMenuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Mobile Dropdown -->
      <div class="mobile-menu" *ngIf="mobileMenuOpen">
        <a routerLink="/dashboard" (click)="closeMobileMenu()" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="mobile-link">Dashboard</a>
        <a routerLink="/history" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-link">Saved History</a>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar-container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      text-decoration: none;
      color: inherit;
    }
    .brand-symbol {
      font-size: 1.25rem;
      color: #000000;
      line-height: 1;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #000000;
      letter-spacing: 0.05em;
    }
    .brand-subtitle {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .nav-links {
      display: none;
      align-items: center;
      gap: 0.5rem;
    }
    @media (min-width: 768px) {
      .nav-links {
        display: flex;
      }
    }
    .nav-link {
      display: inline-flex;
      align-items: center;
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.825rem;
      font-weight: 600;
      color: #525252;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .nav-link:hover {
      color: #000000;
      background: #f5f5f5;
    }
    .nav-link.active {
      color: #ffffff;
      background: #000000;
    }
    .mobile-toggle {
      display: block;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.35rem;
      color: #171717;
      cursor: pointer;
    }
    @media (min-width: 768px) {
      .mobile-toggle {
        display: none;
      }
    }
    .mobile-menu {
      display: flex;
      flex-direction: column;
      padding: 0.5rem 1.25rem 1rem 1.25rem;
      background: #ffffff;
      border-top: 1px solid var(--border-color);
    }
    .mobile-link {
      padding: 0.6rem 0.5rem;
      font-weight: 600;
      font-size: 0.85rem;
      color: #262626;
      text-decoration: none;
    }
    .mobile-link.active {
      color: #000000;
      font-weight: 700;
    }
  `]
})
export class NavbarComponent {
  mobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
