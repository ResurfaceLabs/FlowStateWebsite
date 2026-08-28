import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { X_SHARE_URL } from '../config';

interface ShareToastProps {
  onDismiss: () => void;
}

export function ShareToast({ onDismiss }: ShareToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 9000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl"
      initial={{ opacity: 0, y: 20, x: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
    >
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X size={16} />
      </button>
      <p className="pr-6 text-sm font-semibold">Downloading FlowState…</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Enjoying it? A share helps more than you'd think.
      </p>
      <button
        onClick={() => window.open(X_SHARE_URL, '_blank')}
        className="mt-3 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
      >
        Share on X
      </button>
    </motion.div>
  );
}
