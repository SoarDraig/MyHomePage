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

  // 初始化存储系统
  useEffect(() => {
    initializeStorage()
  }, [])
  return (
    <main className="min-h-screen p-6 md:p-8 relative overflow-hidden">
      {/* 动态背景效果组件 */}
      <BackgroundEffects />

      <div className="w-full h-screen flex flex-col relative z-10">
        {/* 设置按钮 - 右上角 */}
        <div className="absolute top-6 right-6 z-20">
          <SettingsPanel />
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 mb-6">
          <Greeting />
          <Clock />
          <SearchBar />
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 pb-24">
          {/* AI助手 - 仅在桌面端显示 */}
          {!isMobile && (
            <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl flex-1 flex flex-col min-h-0 min-h-[300px]">
              <AIChat />
            </div>
          )}

          {/* 右侧：备忘录独立列 - 所有设备显示 */}
          <div className={`glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl ${isMobile ? 'w-full' : 'md:w-96'} overflow-hidden flex flex-col min-h-[200px] ${isMobile ? 'flex-1' : ''}`}>
            <Notes />
          </div>
        </div>
      </div>

      <DockLinks />
    </main>
  )
}
