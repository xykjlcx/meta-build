import type { ReactNode } from 'react';
import { useCurrentUser } from '../auth';
import { useMenu } from '../menu';
import type { MenuHrefResolver } from '../menu/menu-utils';
import { LayoutPresetProvider } from './layout-preset-provider';
import { layoutRegistry } from './registry-core';
import { useLayoutPreset } from './use-layout-preset';

interface LayoutResolverProps {
  children: ReactNode;
  notificationSlot?: ReactNode;
  resolveMenuHref?: MenuHrefResolver;
}

function LayoutResolverInner({ children, notificationSlot, resolveMenuHref }: LayoutResolverProps) {
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
    >
      {children}
    </Layout>
  );
}

export function LayoutResolver({
  children,
  notificationSlot,
  resolveMenuHref,
}: LayoutResolverProps) {
  return (
    <LayoutPresetProvider>
      <LayoutResolverInner notificationSlot={notificationSlot} resolveMenuHref={resolveMenuHref}>
        {children}
      </LayoutResolverInner>
    </LayoutPresetProvider>
  );
}
