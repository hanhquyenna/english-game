

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public show(message: string, type: "success" | "error" | "info" = "info", duration = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, message, type, duration };

    // Max 3 stacked toasts
    this.toasts = [newToast, ...this.toasts].slice(0, 3);
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l(this.toasts));
  }
}

export const toastManager = new ToastManager();

export const showToast = (
  message: string,
  type: "success" | "error" | "info" = "info",
  duration = 3000,
) => {
  toastManager.show(message, type, duration);
};
