import type { ReactNode } from 'react';
import { useCurrentUser } from '../auth';
import { useMenu } from '../menu';
import type { MenuHrefResolver } from '../menu/menu-utils';
import { LayoutPresetProvider } from './layout-preset-provider';
import { layoutRegistry } from './registry-core';
import type { SystemItem } from './types';
import { useLayoutPreset } from './use-layout-preset';

interface LayoutResolverProps {
  children: ReactNode;
  notificationSlot?: ReactNode;
  resolveMenuHref?: MenuHrefResolver;
  /** L5 注入的九宫格"系统切换"数据，透传到 preset */
  systems?: SystemItem[];
}

function LayoutResolverInner({
  children,
  notificationSlot,
  resolveMenuHref,
  systems,
}: LayoutResolverProps) {
  const { presetId } = useLayoutPreset();
  const menu = useMenu();
  const currentUser = useCurrentUser();
  const preset = layoutRegistry.get(presetId);
  const Layout = preset.component;

  return (
    <Layout
      menuTree={menu.data?.tree ?? []}
      currentUser={currentUser}
      notificationSlot={notificationSlot}
      resolveMenuHref={resolveMenuHref}
      systems={systems}
    >
      {children}
    </Layout>
  );
}

export function LayoutResolver({
  children,
  notificationSlot,
  resolveMenuHref,
  systems,
}: LayoutResolverProps) {
  return (
    <LayoutPresetProvider>
      <LayoutResolverInner
        notificationSlot={notificationSlot}
        resolveMenuHref={resolveMenuHref}
        systems={systems}
      >
        {children}
      </LayoutResolverInner>
    </LayoutPresetProvider>
  );
}
