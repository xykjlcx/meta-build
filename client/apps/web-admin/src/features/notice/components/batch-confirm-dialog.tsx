import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mb/ui-primitives';
import { useTranslation } from 'react-i18next';

export interface BatchConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 操作类型：'publish' | 'delete' */
  action: 'publish' | 'delete';
  total: number;
  valid: number;
  invalid: number;
  onConfirm: () => void;
}

export function BatchConfirmDialog({
  open,
  onOpenChange,
  action,
  total,
  valid,
  invalid,
  onConfirm,
}: BatchConfirmDialogProps) {
  const { t } = useTranslation('notice');

  const confirmKey = action === 'publish' ? 'confirm.batchPublish' : 'confirm.batchDelete';
  const description = t(confirmKey, { total, valid, invalid });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === 'publish' ? t('batch.publish') : t('batch.delete')}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant={action === 'delete' ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {action === 'publish' ? t('action.publish') : t('action.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
