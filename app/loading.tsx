/**
 * 加载状态组件
 * 
 * 这是 Next.js 的加载状态组件，在页面加载过程中显示。
 * 
 * 功能：
 * - 在 Suspense 组件的子组件加载期间渲染
 * - 当前返回 null，表示不显示任何加载界面
 * 
 * 注意事项：
 * - 如果需要自定义加载动画，可以修改返回内容
 * - 在 app/page.tsx 中的 Suspense 组件会使用此组件
 */

export default function Loading() {
  return null
}
