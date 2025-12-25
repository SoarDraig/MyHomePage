/**
 * 根布局组件
 * 
 * 这是 Next.js 应用的根布局组件，定义了整个应用的结构和全局配置。
 * 
 * 功能：
 * - 设置元数据（metadata）：包括标题、描述、图标等
 * - 配置字体：使用 Google Fonts 的 Geist 字体
 * - 集成 Vercel Analytics 分析工具
 * - 定义 HTML 和 body 标签的基本结构
 * 
 * 注意事项：
 * - 使用了自动切换的图标（浅色/深色模式）
 * - 支持中文语言环境 (lang="zh-CN")
 */

import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "新标签页",
  description: "个人浏览器主页",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
