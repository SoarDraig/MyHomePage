/**
 * 主页组件
 * 
 * 这是应用的主页面组件，作为用户访问的入口页面。
 * 
 * 功能：
 * - 使用 Suspense 组件实现异步加载
 * - 渲染 HomeContent 组件，包含所有主要内容
 * - 在加载过程中显示 null（无加载状态）
 * 
 * 注意事项：
 * - 这是服务器组件，在服务端渲染
 * - Suspense 允许子组件进行数据获取而不会阻塞整个页面
 */

import { Suspense } from "react"
import { HomeContent } from "@/components/home-content"

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}
