import type common from '@mb/app-shell/i18n/zh-CN/common.json';
import type shell from '@mb/app-shell/i18n/zh-CN/shell.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      shell: typeof shell;
    };
  }
}
