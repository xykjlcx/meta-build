import type common from '@mb/app-shell/i18n/zh-CN/common.json';
import type shell from '@mb/app-shell/i18n/zh-CN/shell.json';
import type iam from './zh-CN/iam.json';
import type notice from './zh-CN/notice.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      shell: typeof shell;
      iam: typeof iam;
      notice: typeof notice;
    };
  }
}
