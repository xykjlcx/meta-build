import { styleRegistry } from '@mb/ui-tokens';
import type { Preview } from '@storybook/react';
import '../src/storybook.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    style: {
      description: '风格底座',
      toolbar: {
        title: 'Style',
        icon: 'paintbrush',
        items: styleRegistry.getAll().map((style) => ({
          value: style.id,
          title: style.displayName,
        })),
        dynamicTitle: true,
      },
    },
    colorMode: {
      description: '明暗模式',
      toolbar: {
        title: 'Mode',
        icon: 'mirror',
        items: [
          { value: 'light', title: '浅色' },
          { value: 'dark', title: '暗色' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    style: 'classic',
    colorMode: 'light',
  },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.themeStyle = context.globals.style ?? 'classic';

      if (context.globals.colorMode === 'dark') {
        document.documentElement.dataset.themeColorMode = 'dark';
      } else {
        delete document.documentElement.dataset.themeColorMode;
      }

      delete document.body.dataset.themeScale;
      delete document.body.dataset.themeRadius;
      delete document.body.dataset.themeContentLayout;
      delete document.body.dataset.themeSidebarMode;

      return <Story />;
    },
  ],
};

export default preview;
