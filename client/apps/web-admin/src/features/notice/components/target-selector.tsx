import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@mb/ui-primitives';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { NoticeTarget } from '@mb/api-sdk/generated/models';
import { TARGET_TYPE } from '../constants';

interface TargetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (targets: NoticeTarget[]) => void;
}

/**
 * 发布目标选择器 — 弹窗模式。
 *
 * 选项：全员 / 按部门 / 按角色 / 指定用户。
 * 选择后确认发布。
 */
export function TargetSelector({ open, onOpenChange, onConfirm }: TargetSelectorProps) {
  const { t } = useTranslation('notice');
  const [targetType, setTargetType] = useState<string>(TARGET_TYPE.ALL);

  const handleConfirm = useCallback(() => {
    const targets: NoticeTarget[] = [];
    if (targetType === TARGET_TYPE.ALL) {
      targets.push({ targetType: TARGET_TYPE.ALL });
    } else {
      // TODO: 部门/角色/用户选择需要 ApiSelect 集成，Plan B 后完善
      targets.push({ targetType });
    }
    onConfirm(targets);
    onOpenChange(false);
  }, [targetType, onConfirm, onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('target.selectTarget')}</AlertDialogTitle>
          <AlertDialogDescription />
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={targetType} onValueChange={setTargetType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={TARGET_TYPE.ALL} id="target-all" />
              <Label htmlFor="target-all">{t('target.all')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={TARGET_TYPE.DEPT} id="target-dept" />
              <Label htmlFor="target-dept">{t('target.dept')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={TARGET_TYPE.ROLE} id="target-role" />
              <Label htmlFor="target-role">{t('target.role')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={TARGET_TYPE.USER} id="target-user" />
              <Label htmlFor="target-user">{t('target.user')}</Label>
            </div>
          </RadioGroup>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>{t('action.publish')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
