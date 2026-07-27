import React, { useState, useEffect, useRef } from 'react';
import { toast as sonnerToast } from 'sonner';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastNotificationProps {
  id?: string | number;
  type?: ToastType;
  message: React.ReactNode;
  duration?: number; // Duration in milliseconds (default 4000ms)
  onDismiss: () => void;
}

/**
 * ToastNotification Component
 * - 0% to 100% progress bar driven by browser-native CSS keyframes (zero JS state re-renders).
 * - GPU hardware-accelerated pause on hover (`animationPlayState: paused`) and resume on leave (`running`).
 * - Single single-shot `setTimeout` ensuring 100% freeze-free auto-dismissal.
 * - Accessible dismiss close button ('×') with hover highlight.
 */
export const ToastNotification: React.FC<ToastNotificationProps> = ({
  type = 'info',
  message,
  duration = 4000,
  onDismiss,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const onDismissRef = useRef(onDismiss);

  // Store timestamp references for accurate remaining-time pause & resume
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always keep latest onDismiss function ref to prevent stale closures
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Handle single timeout auto-dismissal (pause on hover, resume on leave)
  useEffect(() => {
    if (isHovered) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismissRef.current();
    }, remainingTimeRef.current);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isHovered]);

  // Variant design configurations
  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      border: 'border-emerald-500/30',
      bg: 'bg-slate-900/95',
      text: 'text-slate-100',
      progressBg: 'bg-emerald-500',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      border: 'border-rose-500/30',
      bg: 'bg-slate-900/95',
      text: 'text-slate-100',
      progressBg: 'bg-rose-500',
    },
    info: {
      icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
      border: 'border-cyan-500/30',
      bg: 'bg-slate-900/95',
      text: 'text-slate-100',
      progressBg: 'bg-cyan-500',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      border: 'border-amber-500/30',
      bg: 'bg-slate-900/95',
      text: 'text-slate-100',
      progressBg: 'bg-amber-500',
    },
  }[type];

  return (
    <div
      className={`relative group overflow-hidden w-full max-w-sm rounded-xl border ${config.border} ${config.bg} p-4 shadow-2xl backdrop-blur-xl transition-all duration-200 pointer-events-auto flex items-start gap-3`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      aria-live="polite"
    >
      {/* Notification Variant Icon */}
      <div className="mt-0.5">{config.icon}</div>

      {/* Main Toast Message */}
      <div className={`flex-1 text-xs sm:text-sm font-medium leading-snug pr-6 ${config.text}`}>
        {message}
      </div>

      {/* Accessible Dismiss Close Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/50"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Hardware-Accelerated CSS Progress Bar (0% -> 100%) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60 overflow-hidden rounded-b-xl">
        <div
          className={`h-full ${config.progressBg}`}
          style={{
            animation: `toastFill ${duration}ms linear forwards`,
            animationPlayState: isHovered ? 'paused' : 'running',
          }}
        />
      </div>
    </div>
  );
};

/**
 * Custom Toast Dispatcher Wrapper
 * Drop-in replacement for standard toast calls (`toast.success`, `toast.error`, `toast.info`, `toast.warning`)
 */
export const toast = {
  success: (message: React.ReactNode, options?: { duration?: number }) => {
    const dur = options?.duration || 4000;
    return sonnerToast.custom((id) => (
      <ToastNotification
        id={id}
        type="success"
        message={message}
        duration={dur}
        onDismiss={() => sonnerToast.dismiss(id)}
      />
    ));
  },
  error: (message: React.ReactNode, options?: { duration?: number }) => {
    const dur = options?.duration || 5000;
    return sonnerToast.custom((id) => (
      <ToastNotification
        id={id}
        type="error"
        message={message}
        duration={dur}
        onDismiss={() => sonnerToast.dismiss(id)}
      />
    ));
  },
  info: (message: React.ReactNode, options?: { duration?: number }) => {
    const dur = options?.duration || 4000;
    return sonnerToast.custom((id) => (
      <ToastNotification
        id={id}
        type="info"
        message={message}
        duration={dur}
        onDismiss={() => sonnerToast.dismiss(id)}
      />
    ));
  },
  warning: (message: React.ReactNode, options?: { duration?: number }) => {
    const dur = options?.duration || 4000;
    return sonnerToast.custom((id) => (
      <ToastNotification
        id={id}
        type="warning"
        message={message}
        duration={dur}
        onDismiss={() => sonnerToast.dismiss(id)}
      />
    ));
  },
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};
