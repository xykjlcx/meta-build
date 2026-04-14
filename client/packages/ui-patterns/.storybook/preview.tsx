import { themeRegistry } from '@mb/ui-tokens';
import type { Preview } from '@storybook/react';
import '../src/storybook.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: '主题切换',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: themeRegistry.map((t) => ({ value: t.id, title: t.name })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'default' },
  decorators: [
    (Story, context) => {
      document.documentElement.setAttribute('data-theme', context.globals.theme ?? 'default');
      return <Story />;
    },
  ],
};

export default preview;
