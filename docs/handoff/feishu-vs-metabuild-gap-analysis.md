# 飞书管理后台 vs meta-build lark-console 差距分析

> 2026-04-18 深夜生成 / 基于 Agent Browser 直接从 `g05t3iydj2i.feishu.cn/admin/index` 采集的 computed styles 对比
>
> 配套截图：
> - 真实飞书：`截图/real-feishu-admin.png`、`截图/feishu-research/feishu-full-page.png`
> - meta-build 当前：`截图/lark-console-mix-rollback-v2.png`

---

## 1. 色板真实值（飞书采集）

| 角色 | 实测值 (RGB) | 近似 HEX | meta-build 对应 | 是否一致 |
|------|------|------|------|------|
| Page/Content bg | `rgb(242, 243, 245)` | `#f2f3f5` | `--color-gray-100` | ✅ 一致 |
| Body bg | `rgb(255, 255, 255)` | `#ffffff` | L5 `<body>` 未显式设，继承 | — |
| Header bg | `rgb(255, 255, 255)` | `#ffffff` | Mix Header `bg-card` | ✅ 一致 |
| Sidebar bg | `rgb(242, 243, 245)` | `#f2f3f5` | `--color-sidebar` (= gray-100) | ✅ 一致 |
| Card bg | `rgb(255, 255, 255)` | `#ffffff` | `--color-card` | ✅ 一致 |
| Primary（飞书蓝） | `rgb(51, 112, 255)` | `#3370ff` | `--color-primary` (= blue-500) | ✅ 一致 |
| Tab 激活背景 | `rgba(51, 112, 255, 0.08)` | 蓝 8% 透明 | `--nav-tab-active-bg = blue-100` (不透明 #edf1ff) | ⚠️ 实现不同但视觉近似 |
| Default text | `rgb(31, 35, 41)` | `#1f2329` | `--color-foreground` (= gray-800) | ≈ 近似 |
| Active sidebar text | `rgb(51, 112, 255)` | `#3370ff` | `--color-sidebar-accent-foreground` (= blue-500) | ✅ 一致 |
| Inactive sidebar text | `rgb(0, 0, 0)` *外层* `a` | 纯黑 | `--color-sidebar-foreground` (= gray-800) | ⚠️ 飞书更硬 |

**色板核心结论**：色值本身基本对齐，主要误差在"Tab 激活背景"—— 飞书用 **半透明主色**（`rgba(primary, 0.08)`），meta-build 用**不透明浅蓝**（`blue-100`）。视觉接近但飞书更"活"一些（能看到下层灰底的隐约感）。

---

## 2. 布局几何实测（飞书）

| 维度 | 飞书实测 | meta-build 当前 | 差距 |
|------|----------|---------|------|
| Header 高度 | **56px** | `--size-header-height: 3.5rem` = **56px** | ✅ |
| Sidebar 宽度 | **236px** | `--size-sidebar-width: 14.5rem` = **232px** | ⚠️ 差 4px |
| Sidebar padding | `0 0 70px 0`（底部留 70px）| 常规 | ⚠️ 飞书底部给 "收起导航" 按钮预留 |
| Sidebar item 高度 | **48px** | `h-11` = **44px** | ❌ 差 4px |
| Sidebar item padding | 外层 `<a>` padding=0，内层 div `_1sO9DpVG` 36x48 于 x=14；icon x=20 | `px-4 py-2` = 16px 左右 | ⚠️ 结构不同 |
| Header padding | `0 0 0 10px`（左留 10px） | Mix header `px-1.25rem` = 20px | ⚠️ 飞书更紧 |
| Top Tab 高度 | **36px** | `--nav-tab-height` = `--size-control-h-md` = **32px** | ❌ 差 4px |
| Top Tab padding | `7px 12px` | `var(--nav-tab-padding-x)` = 0.25rem 左右，纵向由 height 控 | ❌ 飞书左右更宽松 |
| Top Tab 圆角 | **4px** | `--radius-sm` = `calc(var(--radius) - 4px)` = **4px** | ✅ |
| Card 圆角 | **4px** | `--radius-lg` = `var(--radius)` = **8px** | ❌ 飞书更方正 |
| Card padding | `20px 20px 16px` | 标准 `p-6` = 24px | ⚠️ 飞书略紧 |
| Card margin | `12px` 上下 | 默认 `space-y-4` = 16px | ⚠️ 飞书更紧 |
| Card shadow | `none` | `--card-shadow: none` | ✅ |
| Main/Aside 位置 | Aside x=8, y=56；Main x=244, y=56 | Aside x=0, Main flex-1 | ⚠️ 飞书 Aside 左边还留 8px |

**布局核心结论**：
1. **Card 圆角 4px**（不是 8px）——这影响整个"视觉紧凑感"，飞书比我们方正；meta-build 默认 `--radius: 0.5rem` 导致所有 `rounded-lg` 都是 8px
2. **Sidebar item 48px / Top Tab 36px**（不是 44/32）——飞书控件都高一档
3. **Aside 左边留 8px**（不贴 body 左边）——一个常被忽视的"呼吸感"细节
4. **Card padding/margin 都比我们紧**（20/16 vs 24/16）

---

## 3. 激活态真相（飞书 DOM 走查结论）

### 3.1 Sidebar 激活态 —— **没有左蓝条**

这是本轮调研的最大真相修正。我前两次误读了截图，飞书 sidebar 激活态：

```
DOM 结构（active "企业概览"）：
<a> 外层 (color:#000, fw:500, bg:transparent, padding:0)
  <div _1sO9DpVG> icon wrapper (36x48)
    <img class=admin-side-menu-icon> 蓝色版 icon (24x24)
  <div nc9sYMTs> 文字 wrapper (color:#3370ff, fw:500)
    <div auc__g-ellipsis>企业概览</div>
```

关键观察：
- 外层 `<a>` **transparent 背景**（无背景色变化）
- 外层 color 是 `rgb(0,0,0)` 纯黑，但内层 `nc9sYMTs` 用 `rgb(51,112,255)` 蓝覆盖文字
- `::before` `::after` 都是 `content: none` —— **没有伪元素蓝条**
- 没有任何子 span/div 具备 3px 宽的蓝色矩形特征
- icon 是 `<img>` 元素，激活时通过**切换 img src 到蓝色版本**实现染色（不是 CSS filter）

**结论**：真实飞书 sidebar 激活态 = 透明背景 + 内层文字蓝 + icon src 替换。**没有左蓝条**。

### 3.2 Top Tab 激活态 —— **半透明主色块**

```
"企业管理" active (DOM class .active):
  backgroundColor: rgba(51, 112, 255, 0.08)   ← 8% 透明主色
  color: rgb(51, 112, 255)                    ← 纯主色蓝
  fontSize: 14px
  fontWeight: 500 (非激活是 400)
  borderRadius: 4px
  padding: 7px 12px
  height: 36px

"企业管理" 左边还有一个 img 图标（20x20，蓝色 IMG）
```

激活态总结：半透明蓝底 + 蓝字 + medium weight + 4px 圆角 + 带 icon。

---

## 4. 字体栈

### 飞书实测
```
LarkHackSafariFont,
LarkEmojiFont,
LarkChineseQuote,
-apple-system,
"system-ui",
"Helvetica Neue",
Tahoma,
"PingFang SC",
"Microsoft Yahei",
Arial,
"Hiragino Sans GB",
sans-serif,
"Apple Color Emoji",
...
```

**关键点**：飞书把自家定制字体 `LarkHackSafariFont` / `LarkEmojiFont` / `LarkChineseQuote` 放在最前（Lark 系产品专属）。这是我们**无法也不应该照抄**的——这是飞书自有字体，其他项目用不了。

### meta-build 当前
```
'PingFang SC', 'Hiragino Sans GB', ui-sans-serif, system-ui, -apple-system, ...
```

**差距**：meta-build 跳过飞书的专属字体直接用 `PingFang SC`，对非飞书环境是合理选择。字体差距实际不大——因为终端用户看到的渲染结果都是 **PingFang SC**（飞书 Lark 字体在普通网页不会加载到）。

✅ 字体不需要改。

### 字号

- 飞书：14px（root + body + 所有 tab / sidebar）
- meta-build：默认 14px ✅ 一致

---

## 5. 详细差距汇总（按优先级排序）

| # | 差距项 | 影响度 | 修改难度 | 建议动作 |
|---|--------|-------|---------|---------|
| **1** | Card 圆角 `8px → 4px` | 🔴 高（影响所有卡片的视觉气质） | 低 | `--radius` 从 `0.5rem` 降到 `0.25rem` 只影响 lark-console；或新增 `--card-radius: var(--radius-sm)` 覆盖 lark-console 的 card |
| **2** | **取消 sidebar 左 3px 蓝条** | 🔴 高（飞书没有）| 低 | MixSidebar 的 `ActiveIndicator` 组件在 lark-console 下不渲染；或者删除 ActiveIndicator 统一不要 |
| **3** | Sidebar item 高度 `44px → 48px` | 🟡 中 | 低 | Mix Layout 里 TopNavItem 的 `h-11` 改为 `h-12`；或扩展 `--sidebar-item-height` token 让 lark-console 用更高档 |
| **4** | Top Tab 高度 `32px → 36px` | 🟡 中 | 低 | `--nav-tab-height` 改为 `2.25rem`（h-9），或 `--size-control-h-lg` |
| **5** | Top Tab padding `0.25rem → 7px 12px` | 🟡 中 | 低 | `--nav-tab-padding-x: 0.75rem`，增加 `--nav-tab-padding-y: 0.4375rem` |
| **6** | Tab 激活背景 `blue-100 → rgba(primary, 0.08)` | 🟢 低（视觉接近）| 中 | 需要新增一个 primitive token `--color-blue-100-alpha-08` 或接受不一致 |
| **7** | Sidebar 左边留 8px（不贴左边）| 🟢 低 | 低 | Mix Layout 给 aside 加 `ml-2` 或类似 |
| **8** | Card padding `24 → 20/16` | 🟢 低 | 低 | `--card-padding: 1.25rem` 覆盖 |
| **9** | Card gap `16 → 12` | 🟢 低 | 低 | 业务层 `space-y-3` 替代 `space-y-4` |

优先级解释：
- 🔴 高：这些改动**目视差距很明显**，改了立刻"像飞书"
- 🟡 中：改了气质更对，但不改也能接受
- 🟢 低：细节调优，改了锦上添花

---

## 6. 推荐下一步（Phase 3 规划）

### Phase 3A：视觉大差距（高优先级）—— 预估 30 分钟

1. **Card 圆角改 4px**
   - 方案：`semantic-lark-console.css` 里 `--radius-lg: calc(var(--radius) - 4px)` = 4px（覆盖全局 0.5rem 基值的 lark-console 视图）
   - 或更稳妥：`component.css` 里 `--card-radius: var(--radius-sm)`
   - 影响：Card / Dialog / NxTable 外框

2. **取消 Sidebar 左蓝条**
   - 方案：`mix-layout.tsx` 里所有 `<ActiveIndicator />` 调用移除
   - 或保留 ActiveIndicator 组件但在 lark-console 下通过 CSS 隐藏

3. **Sidebar item 高 48 + Tab 高 36**
   - Mix Layout `TopNavItem` 的 `h-11` 改 `h-12`（44→48）
   - `--nav-tab-height` 改为 `2.25rem`（32→36）

### Phase 3B：细节调优（低优先级，可选）—— 预估 20 分钟

4. Tab padding 改 `7px 12px`
5. Aside 左留 8px
6. Card padding/gap 略紧

### Phase 3C：色板微调（低优先级，可选）—— 预估 10 分钟

7. Tab active bg 改半透明 `rgba(51, 112, 255, 0.08)`（需新增 primitive token 或直接写字面量）

---

## 7. 这一轮得到的"反面教训"

1. **不要从"已处理过的二手截图"推断真相**。我把洋哥贴的对比图（已被他自己理解过的飞书）当成真实飞书，导致 Phase 1 第一轮往"下划线+灰底"走——真实飞书是 pill + 透明背景
2. **不要从 nxboot-v2 的仿品细节反推原件**。nxboot-v2 加了左 3px 蓝条，但真实飞书没有。仿品会夹带原作者的审美改良
3. **Computed style 拉一遍胜过目视估计**。本次用 Agent Browser eval 直接拉 getComputedStyle，才发现：
   - Tab bg 是半透明不是不透明
   - Sidebar 激活文字蓝在**内层 div** 而不是外层 `<a>`
   - 根本没有左蓝条
   - 飞书用自有字体 LarkHackSafariFont

固化规则（见 `docs/rules/`）：**对标任何 UI 的视觉"像不像"之前，先用 Agent Browser 拉 computed style，不要凭截图目测。**
