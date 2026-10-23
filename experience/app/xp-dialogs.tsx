'use client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
export function Confirm({
  title,
  message,
  confirm = 'Yes',
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirm?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog
      open
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <AlertDialogContent
        className="xp-message-dialog"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onCancel();
          }
        }}
      >
        <div className="message-title">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <button aria-label="Close confirmation" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="message-body">
          <img src="/icons/warning.png" alt="" />
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </div>
        <div className="message-actions">
          <button className="xp-button" onClick={onConfirm}>
            {confirm}
          </button>
          <button className="xp-button" autoFocus onClick={onCancel}>
            Cancel
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export function UtilityDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="xp-message-dialog" showCloseButton={false}>
        <div className="message-title">
          <DialogTitle>{title}</DialogTitle>
          <button aria-label={`Close ${title}`} onClick={onClose}>
            ×
          </button>
        </div>
        <div className="utility-body">{children}</div>
        <div className="message-actions">
          <button className="xp-button" onClick={onClose}>
            OK
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
