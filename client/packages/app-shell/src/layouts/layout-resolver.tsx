import type { ReactNode } from 'react';
import { useCurrentUser } from '../auth';
import { useMenu } from '../menu';
import { LayoutPresetProvider } from './layout-preset-provider';
import { layoutRegistry } from './registry-core';
import { useLayoutPreset } from './use-layout-preset';

interface LayoutResolverProps {
  children: ReactNode;
  notificationSlot?: ReactNode;
}

function LayoutResolverInner({ children, notificationSlot }: LayoutResolverProps) {
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
    >
      {children}
    </Layout>
  );
}

export function LayoutResolver({ children, notificationSlot }: LayoutResolverProps) {
  return (
    <LayoutPresetProvider>
      <LayoutResolverInner notificationSlot={notificationSlot}>{children}</LayoutResolverInner>
    </LayoutPresetProvider>
  );
}
