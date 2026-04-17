// 404 页面使用内联样式，因为 StyleProvider/CSS 变量可能未初始化
// 文案硬编码中文，因为 i18n Provider 可能未初始化

export function GlobalNotFoundPage() {
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
      <h1
        style={{
          fontSize: '6rem',
          fontWeight: 'bold',
          color: '#e5e5e5',
          margin: 0,
        }}
      >
        404
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '1.5rem' }}>页面不存在</p>
      <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
        返回首页
      </a>
    </div>
  );
}
