import { Badge, Button } from '@mb/ui-primitives';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';

/**
 * 未读公告计数 Badge — 通用组件。
 *
 * L4 组件不依赖任何业务 API，查询函数由 L5 注入。
 */
export interface NotificationBadgeProps {
  /** 查询函数，返回未读数量 */
  queryFn: () => Promise<number>;
  /** TanStack Query 的 queryKey */
  queryKey: string[];
  onClick?: () => void;
}

export function NotificationBadge({ queryFn, queryKey, onClick }: NotificationBadgeProps) {
  const { data } = useQuery({
    queryKey,
    queryFn,
    staleTime: 60_000, // 1 分钟缓存
    retry: 1,
  });

  const count = data ?? 0;

  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="relative">
      <Bell className="size-4" />
      {count > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  );
}
