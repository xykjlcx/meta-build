import { styleRegistry } from '@mb/ui-tokens';
import type { Preview } from '@storybook/react';
import '../src/storybook.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
  },
  globalTypes: {
    style: {
      description: '风格底座',
      toolbar: {
        title: 'Style',
        icon: 'paintbrush',
        items: styleRegistry.map((style) => ({
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
      document.documentElement.dataset.style = context.globals.style ?? 'classic';

      if (context.globals.colorMode === 'dark') {
        document.documentElement.dataset.mode = 'dark';
      } else {
        delete document.documentElement.dataset.mode;
      }

      delete document.documentElement.dataset.theme;
      delete document.body.dataset.themeScale;
      delete document.body.dataset.themeRadius;
      delete document.body.dataset.themeContentLayout;

      return <Story />;
    },
  ],
};

export default preview;
