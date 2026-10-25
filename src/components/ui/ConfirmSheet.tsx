"use client";

import { Button } from "./Button";
import { Sheet } from "./Sheet";

/**
 * Asking before something that cannot be undone (signing out, erasing data). Used sparingly:
 * everyday deletions are undone from the toast instead.
 */
export function ConfirmSheet({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="-mt-2 text-center text-body-small text-balance text-text-secondary">{message}</p>
      <div className="mt-6 flex flex-col gap-1">
        <Button
          className={danger ? "!bg-none !bg-danger !shadow-none" : ""}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
        <Button variant="plain" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </Sheet>
  );
}
