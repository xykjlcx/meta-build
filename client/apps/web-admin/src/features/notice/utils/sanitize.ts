import DOMPurify from 'dompurify';

/**
 * DOMPurify 白名单 — 与后端 jsoup Safelist 对齐。
 * 不允许 style 属性，防止 CSS 注入。
 */
const ALLOWED_TAGS = [
  'div',
  'span',
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'img',
  'a',
  'strong',
  'em',
  'u',
  's',
  'sub',
  'sup',
];

const ALLOWED_ATTR = [
  'href',
  'title',
  'target',
  'src',
  'alt',
  'width',
  'height',
  'colspan',
  'rowspan',
  'class',
];

/**
 * 净化 HTML 内容。在渲染用户提交的富文本时使用。
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
