"use client"

import { useEffect } from "react"
import { Clock } from "@/components/clock"
import { Greeting } from "@/components/greeting"
import { Notes } from "@/components/notes"
import { SearchBar } from "@/components/search-bar"
import { AIChat } from "@/components/ai-chat"
import { DockLinks } from "@/components/dock-links"
import { SettingsPanel } from "@/components/settings-panel"
import { BackgroundEffects } from "@/components/background-effects"
import { initializeStorage } from "@/lib/storage"
import { useIsMobile } from "@/hooks/use-mobile"

export function HomeContent() {
  const isMobile = useIsMobile()

  // 初始化存储系统并监听配置变化
  useEffect(() => {
    initializeStorage()
  }, [])

  // 监听配置更新事件
  useEffect(() => {
    const handleProfileUpdate = () => {
      // 组件会自动从storage读取最新配置
    }
    window.addEventListener('profile-settings-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-settings-updated', handleProfileUpdate)
  }, [])
  return (
    <main className="min-h-screen p-6 md:p-8 relative overflow-hidden">
      {/* 动态背景效果组件 */}
      <BackgroundEffects />

      <div className="w-full h-[calc(92vh-2rem)] flex flex-col relative z-10">
        <div className="flex-shrink-0 mb-6 px-6">
          <div className="w-full flex">
            {/* 左侧容器 - 1/4 区域 */}
            <div className="w-1/4">
              {/* 预留：未来可能添加左侧内容 */}
            </div>
            
            {/* 中央内容 - 1/2 区域，居中 */}
            <div className="w-1/2 flex flex-col items-center justify-center space-y-4">
              <Greeting />
              <Clock />
              <SearchBar />
            </div>
            
            {/* 右侧容器 - 1/4 区域 */}
            <div className="w-1/4 relative">
              {/* 设置按钮 - 位于右上角容器右上角 */}
              <div className="absolute top-0 right-0">
                <SettingsPanel />
              </div>
              {/* 预留：未来可能添加右侧内容 */}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 px-6">
          {/* AI助手 - 仅在桌面端显示，最多60%宽度 */}
          {!isMobile && (
            <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl flex-[3] flex flex-col min-h-0 min-h-[300px] max-w-[60%]">
              <AIChat />
            </div>
          )}

          {/* 右侧：备忘录独立列 - 所有设备显示，约40%宽度 */}
          <div className={`glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl ${isMobile ? 'w-full' : 'md:flex-[2]'} overflow-hidden flex flex-col min-h-[200px] ${isMobile ? 'flex-1' : ''}`}>
            <Notes />
          </div>
        </div>
      </div>

      <DockLinks />
    </main>
  )
}
