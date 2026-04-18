/**
 * BgBlobs — 背景装饰组件（两个模糊圆形渐变）。
 *
 * 视觉标志复用：
 * - claude-inset preset（layout--inset 暖深色铺底）
 * - claude-rail preset（layout--rail 窄轨道侧栏）
 *
 * 100% 还原 Claude Design `/styles/app.css` 的 `.bg-blobs`：
 * - brand 色左上（-top-24 -left-20，opacity 0.35）
 * - info 色右下（-bottom-36 -right-24，opacity 0.22）
 * - pointer-events-none + aria-hidden，纯装饰不影响交互 / 辅助技术
 *
 * 用法：放在最外层容器（需带 relative overflow-hidden）之下，z-index 默认 0，内容需要
 * 比装饰高一层时在包裹层手动加 `relative z-10`。
 */
export function BgBlobs() {
  return (
    <div
      data-testid="bg-blobs"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -top-24 -left-20 h-[500px] w-[500px] rounded-full bg-primary opacity-[0.35] blur-[120px]" />
      <div className="absolute -bottom-36 -right-24 h-[500px] w-[500px] rounded-full bg-info opacity-[0.22] blur-[120px]" />
    </div>
  );
}
