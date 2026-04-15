import { type DeptView, type NoticeTarget, getDept, getRole, getUser } from '@mb/api-sdk';
import { ApiSelect, type ApiSelectFetchResult } from '@mb/ui-patterns';
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const [targetId, setTargetId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setTargetType(TARGET_TYPE.ALL);
      setTargetId(null);
    }
  }, [open]);

  const handleTargetTypeChange = useCallback((nextTargetType: string) => {
    setTargetType(nextTargetType);
    setTargetId(null);
  }, []);

  const fetchDeptOptions = useCallback(
    async ({
      keyword,
    }: {
      keyword: string;
      page: number;
      size: number;
    }): Promise<ApiSelectFetchResult<number>> => {
      const flattenDepts = (nodes: DeptView[], depth = 0): Array<{ id: number; label: string }> =>
        nodes.flatMap((node) => {
          if (!node.id) {
            return [];
          }

          const label = `${'　'.repeat(depth)}${node.name ?? `#${node.id}`}`;
          const current = [{ id: node.id, label }];
          const children = node.children ? flattenDepts(node.children, depth + 1) : [];
          return [...current, ...children];
        });

      const keywordLower = keyword.trim().toLowerCase();
      const options = flattenDepts(await getDept())
        .filter((item) => item.label.toLowerCase().includes(keywordLower))
        .map((item) => ({
          value: item.id,
          label: item.label,
          searchText: item.label,
        }));

      return { options, totalElements: options.length };
    },
    [],
  );

  const fetchRoleOptions = useCallback(
    async ({
      keyword,
      page,
      size,
    }: {
      keyword: string;
      page: number;
      size: number;
    }): Promise<ApiSelectFetchResult<number>> => {
      const response = await getRole({ page, size });
      const keywordLower = keyword.trim().toLowerCase();
      const options = (response.content ?? [])
        .filter((role) => {
          const candidate = `${role.name ?? ''} ${role.code ?? ''}`.toLowerCase();
          return candidate.includes(keywordLower);
        })
        .map((role) => ({
          value: role.id ?? 0,
          label: role.name ?? role.code ?? `#${role.id}`,
          searchText: `${role.name ?? ''} ${role.code ?? ''}`.trim(),
        }))
        .filter((option) => option.value > 0);

      return { options, totalElements: response.totalElements ?? options.length };
    },
    [],
  );

  const fetchUserOptions = useCallback(
    async ({
      keyword,
      page,
      size,
    }: {
      keyword: string;
      page: number;
      size: number;
    }): Promise<ApiSelectFetchResult<number>> => {
      const response = await getUser({ page, size });
      const keywordLower = keyword.trim().toLowerCase();
      const options = (response.content ?? [])
        .filter((user) => {
          const candidate = `${user.nickname ?? ''} ${user.username ?? ''} ${user.email ?? ''}`
            .toLowerCase()
            .trim();
          return candidate.includes(keywordLower);
        })
        .map((user) => ({
          value: user.id ?? 0,
          label: user.nickname || user.username || `#${user.id}`,
          searchText: `${user.nickname ?? ''} ${user.username ?? ''} ${user.email ?? ''}`.trim(),
        }))
        .filter((option) => option.value > 0);

      return { options, totalElements: response.totalElements ?? options.length };
    },
    [],
  );

  const selectorConfig = useMemo(() => {
    switch (targetType) {
      case TARGET_TYPE.DEPT:
        return {
          fetcher: fetchDeptOptions,
          placeholder: t('target.selectDept'),
        };
      case TARGET_TYPE.ROLE:
        return {
          fetcher: fetchRoleOptions,
          placeholder: t('target.selectRole'),
        };
      case TARGET_TYPE.USER:
        return {
          fetcher: fetchUserOptions,
          placeholder: t('target.selectUser'),
        };
      default:
        return null;
    }
  }, [fetchDeptOptions, fetchRoleOptions, fetchUserOptions, t, targetType]);

  const handleConfirm = useCallback(() => {
    if (targetType === TARGET_TYPE.ALL) {
      onConfirm([{ targetType: TARGET_TYPE.ALL }]);
      onOpenChange(false);
      return;
    }

    if (targetId === null) {
      return;
    }

    const targets: NoticeTarget[] = [{ targetType, targetId }];

    onConfirm(targets);
    onOpenChange(false);
  }, [targetId, targetType, onConfirm, onOpenChange]);

  const confirmDisabled = targetType !== TARGET_TYPE.ALL && targetId === null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('target.selectTarget')}</AlertDialogTitle>
          <AlertDialogDescription>{t('target.description')}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={targetType} onValueChange={handleTargetTypeChange}>
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

          {selectorConfig ? (
            <div className="space-y-2">
              <Label>{selectorConfig.placeholder}</Label>
              <ApiSelect<number>
                value={targetId}
                onChange={setTargetId}
                fetcher={selectorConfig.fetcher}
                placeholder={selectorConfig.placeholder}
                loadingText={t('target.loading')}
                emptyText={t('target.empty')}
              />
            </div>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
          <AlertDialogAction disabled={confirmDisabled} onClick={handleConfirm}>
            {t('action.publish')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
