import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="onBackdropClick($event)">
      <div class="modal-dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">{{ title }}</h3>
            <p class="modal-subtitle text-muted text-sm">{{ subtitle }}</p>
          </div>
        </div>

        <div class="modal-body">
          <ng-content></ng-content>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" (click)="cancel.emit()">
            Cancel
          </button>
          <button 
            type="button" 
            class="btn btn-primary btn-sm"
            (click)="confirm.emit()"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-dialog {
      background: #ffffff;
      border-radius: var(--radius-lg);
      max-width: 440px;
      width: 100%;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }
    .modal-header {
      padding: 1.25rem 1.25rem 0.75rem 1.25rem;
    }
    .modal-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #000000;
      margin-bottom: 0.2rem;
    }
    .modal-subtitle {
      line-height: 1.4;
    }
    .modal-body {
      padding: 0 1.25rem 1.25rem 1.25rem;
      color: #404040;
      font-size: 0.85rem;
    }
    .modal-footer {
      padding: 0.85rem 1.25rem;
      background: #fafafa;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() subtitle = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() isDanger = true;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel.emit();
    }
  }
}
