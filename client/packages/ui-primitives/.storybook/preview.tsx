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
    theme: {
      description: '主题切换',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: '默认' },
          { value: 'dark', title: '暗色' },
          { value: 'compact', title: '高密度' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'default',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'default';
      document.documentElement.dataset.theme = theme;
      return <Story />;
    },
  ],
};

export default preview;
