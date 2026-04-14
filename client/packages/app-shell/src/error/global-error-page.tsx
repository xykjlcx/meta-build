// 错误页面使用内联样式，因为 ThemeProvider/CSS 变量可能未初始化
// 文案硬编码中文，因为 i18n Provider 可能未初始化

export function GlobalErrorPage({ error }: { error?: Error | null }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>出错了</h1>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        {error?.message ?? '页面渲染异常'}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          padding: '0.5rem 1.5rem',
          cursor: 'pointer',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: '#fff',
        }}
      >
        刷新页面
      </button>
    </div>
  );
}
