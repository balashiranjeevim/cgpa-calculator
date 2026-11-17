import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, ToastMessage } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toasts.length > 0">
      <div 
        *ngFor="let toast of toasts" 
        class="toast-item"
      >
        <div class="toast-content">
          <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="close(toast.id)" aria-label="Close notification">
          &times;
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 360px;
      width: calc(100vw - 3rem);
    }
    .toast-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #000000;
      color: #ffffff;
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .toast-content {
      flex: 1;
    }
    .toast-title {
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.15rem;
    }
    .toast-message {
      font-size: 0.825rem;
      color: #d4d4d4;
      line-height: 1.35;
    }
    .toast-close {
      background: none;
      border: none;
      color: #a3a3a3;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }
    .toast-close:hover {
      color: #ffffff;
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private sub?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.sub = this.notificationService.getToasts().subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  close(id: string): void {
    this.notificationService.remove(id);
  }
}
