import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <div class="stat-top">
        <span class="stat-title">{{ title }}</span>
        <span class="stat-badge" *ngIf="badgeText">{{ badgeText }}</span>
      </div>
      <div class="stat-value font-mono">{{ value }}</div>
      <div class="stat-subtitle" *ngIf="subtitle">{{ subtitle }}</div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .stat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .stat-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #000000;
      line-height: 1.1;
      margin: 0.2rem 0;
    }
    .stat-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .stat-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
      background: #f5f5f5;
      color: #171717;
      border: 1px solid var(--border-color);
    }
  `]
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() subtitle?: string;
  @Input() badgeText?: string;
}
