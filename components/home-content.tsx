"use client"

import { useState, useEffect } from "react"
import { Clock } from "@/components/clock"
import { Greeting } from "@/components/greeting"
import { AggregationCenter } from "@/components/aggregation-center"
import { SearchBar } from "@/components/search-bar"
import { AIChat } from "@/components/ai-chat"
import { DockLinks } from "@/components/dock-links"
import { SettingsPanel } from "@/components/settings-panel"
import { BackgroundEffects } from "@/components/background-effects"
import { initializeStorage, storage, STORAGE_KEYS, DEFAULT_USER_PROFILE } from "@/lib/storage"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Zap, Moon } from "lucide-react"

export function HomeContent() {
  const isMobile = useIsMobile()
  const [functionMode, setFunctionMode] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // 初始化存储系统并监听配置变化
  useEffect(() => {
    initializeStorage()
    loadModes()
  }, [])

  // 加载模式状态
  const loadModes = () => {
    const userProfile = storage.get(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
    setFunctionMode(userProfile.functionMode !== false)
    setDarkMode(userProfile.darkMode === true)
  }

  // 监听配置更新事件
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadModes()
    }
    window.addEventListener('profile-settings-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-settings-updated', handleProfileUpdate)
  }, [])

  // 切换功能模式
  const toggleFunctionMode = () => {
    const userProfile = storage.get(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
    const newValue = userProfile.functionMode === false
    storage.set(STORAGE_KEYS.USER_PROFILE, { ...userProfile, functionMode: newValue })
    setFunctionMode(newValue)
    
    // 触发更新事件
    const event = new CustomEvent('profile-settings-updated', { 
      detail: { userProfile: { ...userProfile, functionMode: newValue } } 
    })
    window.dispatchEvent(event)
  }

  // 切换深色模式
  const toggleDarkMode = () => {
    const userProfile = storage.get(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
    const newValue = !userProfile.darkMode
    storage.set(STORAGE_KEYS.USER_PROFILE, { ...userProfile, darkMode: newValue })
    setDarkMode(newValue)
    
    // 触发更新事件
    const event = new CustomEvent('profile-settings-updated', { 
      detail: { userProfile: { ...userProfile, darkMode: newValue } } 
    })
    window.dispatchEvent(event)
  }
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
              {/* 快速切换按钮 - 位于设置按钮下方 */}
              <div className="absolute top-0 right-0 flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFunctionMode}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      functionMode 
                        ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500' 
                        : 'bg-white/10 hover:bg-white/20 text-muted-foreground'
                    }`}
                    title={functionMode ? "关闭功能模式" : "开启功能模式"}
                  >
                    <Zap className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      darkMode 
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-500' 
                        : 'bg-white/10 hover:bg-white/20 text-muted-foreground'
                    }`}
                    title={darkMode ? "关闭深色模式" : "开启深色模式"}
                  >
                    <Moon className="h-5 w-5" />
                  </Button>
                  <SettingsPanel />
                </div>
              </div>
              {/* 预留：未来可能添加右侧内容 */}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 px-6">
          {/* AI助手 - 仅在桌面端且功能模式开启时显示，最多60%宽度 */}
          {functionMode && !isMobile && (
            <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl flex-[3] flex flex-col min-h-0 min-h-[300px] max-w-[60%]">
              <AIChat />
            </div>
          )}

          {/* 右侧：聚合中心 - 仅在功能模式开启时显示，约40%宽度 */}
          {functionMode && (
            <div className={`glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl ${isMobile ? 'w-full' : 'md:flex-[2]'} overflow-hidden flex flex-col min-h-[200px] ${isMobile ? 'flex-1' : ''}`}>
              <AggregationCenter />
            </div>
          )}
        </div>
      </div>

      <DockLinks />
    </main>
  )
}
