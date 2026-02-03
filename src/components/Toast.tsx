import React from 'react';

type ToastProps = { id: string; type: 'success' | 'error'; message: string; onClose: (id: string) => void };

const Toast: React.FC<ToastProps> = ({ id, type, message, onClose }) => {
  return (
    <div
      className={`toast ${type === 'success' ? 'toast-success' : 'toast-error'} rounded-md`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm">{message}</div>
        <button
          aria-label="Dismiss"
          onClick={() => onClose(id)}
          className="btn btn-ghost"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
