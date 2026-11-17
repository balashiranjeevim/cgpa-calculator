import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toasts$ = new BehaviorSubject<ToastMessage[]>([]);

  getToasts(): Observable<ToastMessage[]> {
    return this.toasts$.asObservable();
  }

  show(toast: Omit<ToastMessage, 'id'>): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration ?? 4000
    };

    const current = this.toasts$.getValue();
    this.toasts$.next([...current, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newToast.duration);
    }
  }

  success(message: string, title: string = 'Success'): void {
    this.show({ type: 'success', title, message });
  }

  error(message: string, title: string = 'Error'): void {
    this.show({ type: 'error', title, message, duration: 6000 });
  }

  info(message: string, title: string = 'Notice'): void {
    this.show({ type: 'info', title, message });
  }

  warning(message: string, title: string = 'Warning'): void {
    this.show({ type: 'warning', title, message });
  }

  remove(id: string): void {
    const current = this.toasts$.getValue();
    this.toasts$.next(current.filter(t => t.id !== id));
  }
}
