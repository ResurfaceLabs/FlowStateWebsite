import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isValidEmail } from '../lib/downloadFlow';

interface EmailCapturePanelProps {
  onSubmit: (email: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export function EmailCapturePanel({ onSubmit, onSkip, onClose }: EmailCapturePanelProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("That doesn't look like a valid email.");
      return;
    }
    onSubmit(email.trim());
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold">Get FlowState</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Drop your email and we'll let you know when new features ship. Totally optional.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-5">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-foreground py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Download
            </button>
          </form>

          <button
            type="button"
            onClick={onSkip}
            className="mt-3 w-full text-center text-xs text-muted-foreground/70 transition-colors hover:text-muted-foreground"
          >
            Skip and download
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
