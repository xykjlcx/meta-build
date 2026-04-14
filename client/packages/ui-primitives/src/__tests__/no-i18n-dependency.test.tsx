import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, Button, Dialog, DialogContent, DialogTrigger, Input } from '../index';

describe('L2 i18n 隔离', () => {
  it('Button 在无 I18nextProvider 环境下应该正常渲染', () => {
    expect(() => render(<Button>测试</Button>)).not.toThrow();
  });

  it('Input 在无 I18nextProvider 环境下应该正常渲染', () => {
    expect(() => render(<Input placeholder="请输入" />)).not.toThrow();
  });

  it('Badge 在无 I18nextProvider 环境下应该正常渲染', () => {
    expect(() => render(<Badge>状态</Badge>)).not.toThrow();
  });

  it('Dialog 文案 props 应该按字面量渲染（不查 i18n）', () => {
    const { getByText } = render(
      <Dialog open>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent closeLabel="关闭弹窗">
          <div>正文</div>
        </DialogContent>
      </Dialog>,
    );
    expect(getByText('打开')).toBeDefined();
  });
});
