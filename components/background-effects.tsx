"use client"

import { useState, useEffect } from "react"
import { storage, STORAGE_KEYS, DEFAULT_USER_PROFILE, type UserProfile } from "@/lib/storage"

type TimeOfDay = "dawn" | "morning" | "day" | "afternoon" | "evening" | "dusk" | "night"

interface BackgroundGradient {
  from: string
  to: string
  accent?: string
}

// 去掉天气功能，只基于时间的颜色主题
// 注意：设计时考虑了文字可读性，避免背景过亮或过暗导致文字看不清
const BACKGROUND_THEMES: Record<TimeOfDay, BackgroundGradient> = {
  dawn: {
    // 黎明 - 淡紫色到淡粉色
    from: "linear-gradient(135deg, #e8d5f2 0%, #d4a5e8 100%)",
    to: "linear-gradient(135deg, #f5e6fa 0%, #e8b4d9 100%)",
    accent: "rgba(147, 112, 219, 0.3)",
  },
  morning: {
    // 早晨 - 温暖的淡黄色到浅橙色
    from: "linear-gradient(135deg, #fff5e6 0%, #ffe4c4 100%)",
    to: "linear-gradient(135deg, #ffe4b5 0%, #ffd699 100%)",
    accent: "rgba(255, 200, 100, 0.3)",
  },
  day: {
    // 白天 - 清新的白色偏蓝色
    from: "linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)",
    to: "linear-gradient(135deg, #e6f2ff 0%, #cce7ff 100%)",
    accent: "rgba(135, 206, 250, 0.35)",
  },
  afternoon: {
    // 下午 - 温暖的浅黄色
    from: "linear-gradient(135deg, #fff8dc 0%, #ffecb3 100%)",
    to: "linear-gradient(135deg, #ffeaa7 0%, #ffd966 100%)",
    accent: "rgba(255, 215, 0, 0.35)",
  },
  evening: {
    // 傍晚 - 橙黄色到粉红色
    from: "linear-gradient(135deg, #ffbb77 0%, #ff9a8b 100%)",
    to: "linear-gradient(135deg, #ffa54f 0%, #ff8c69 100%)",
    accent: "rgba(255, 140, 0, 0.35)",
  },
  dusk: {
    // 黄昏 - 柔和的橙粉色到淡紫色
    from: "linear-gradient(135deg, #f7b731 0%, #eb3b5a 100%)",
    to: "linear-gradient(135deg, #fa8231 0%, #d63031 100%)",
    accent: "rgba(255, 150, 50, 0.35)",
  },
  night: {
    // 深夜 - 深蓝紫色带暖光
    from: "linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)",
    to: "linear-gradient(135deg, #34495e 0%, #2c3e50 100%)",
    accent: "rgba(255, 140, 0, 0.5)",
  },
}

// 装饰元素配置
const DECORATION_ELEMENTS: Record<TimeOfDay, React.ReactNode> = {
  dawn: (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 黎明光晕 - 淡紫色 */}
      <div className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-35 animate-pulse"
        style={{
          top: "-150px",
          left: "-100px",
          background: "radial-gradient(circle, rgba(147, 112, 219, 0.7) 0%, rgba(138, 43, 226, 0) 70%)",
          animationDuration: "10s",
        }}
      />
      {/* 温和的晨光 */}
      <div className="absolute w-[400px] h-[400px] rounded-full blur-2xl opacity-30"
        style={{
          top: "5%",
          right: "5%",
          background: "radial-gradient(circle, rgba(255, 182, 193, 0.6) 0%, rgba(255, 105, 180, 0) 70%)",
        }}
      />
      {/* 柔和的光粒子 */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full blur-sm opacity-35 animate-pulse"
          style={{
            top: `${15 + i * 12}%`,
            left: `${10 + i * 10}%`,
            background: "rgba(230, 230, 250, 0.7)",
            animationDelay: `${i * 0.6}s`,
            animationDuration: "5s",
          }}
        />
      ))}
    </div>
  ),
  morning: (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 太阳光晕 - 温暖的晨光 */}
      <div className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-45 animate-pulse"
        style={{
          top: "-150px",
          left: "-100px",
          background: "radial-gradient(circle, rgba(255, 200, 100, 0.8) 0%, rgba(255, 165, 0, 0) 70%)",
          animationDuration: "8s",
        }}
      />
      {/* 光束效果 */}
      <div className="absolute w-[300px] h-[300px] rounded-full blur-2xl opacity-35"
        style={{
          top: "10%",
          right: "5%",
          background: "linear-gradient(45deg, rgba(255, 200, 100, 0.6) 0%, transparent 100%)",
        }}
      />
      {/* 柔和的光粒子 */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full blur-sm opacity-40 animate-pulse"
          style={{
            top: `${20 + i * 12}%`,
            left: `${10 + i * 9}%`,
            background: "rgba(255, 200, 100, 0.6)",
            animationDelay: `${i * 0.5}s`,
            animationDuration: "4s",
          }}
        />
      ))}
    </div>
  ),
  day: (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 明亮的阳光 - 蓝白色调 */}
      <div className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-55 animate-pulse"
        style={{
          top: "-200px",
          left: "5%",
          background: "radial-gradient(circle, rgba(135, 206, 250, 0.9) 0%, rgba(70, 130, 180, 0.5) 40%, rgba(255, 255, 255, 0) 70%)",
          animationDuration: "6s",
        }}
      />
      {/* 第二层光 - 更清新的蓝色 */}
      <div className="absolute w-[400px] h-[400px] rounded-full blur-2xl opacity-45 animate-pulse"
        style={{
          top: "-100px",
          left: "15%",
          background: "radial-gradient(circle, rgba(173, 216, 230, 0.8) 0%, rgba(100, 149, 237, 0.4) 50%, transparent 70%)",
          animationDelay: "1s",
          animationDuration: "5s",
        }}
      />
      {/* 光线散射效果 - 蓝白色 */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[150px] h-[300px] blur-xl opacity-25 animate-pulse"
          style={{
            top: "-50px",
            left: `${5 + i * 10}%`,
            transform: `rotate(${i * 3}deg)`,
            background: "linear-gradient(180deg, rgba(135, 206, 250, 0.6) 0%, transparent 100%)",
            animationDelay: `${i * 0.3}s`,
            animationDuration: "7s",
          }}
        />
      ))}
      {/* 清新的光粒子 */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full blur-sm opacity-30 animate-pulse"
          style={{
            top: `${10 + Math.random() * 60}%`,
            left: `${5 + Math.random() * 80}%`,
            background: "rgba(135, 206, 250, 0.8)",
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}
      {/* 云朵装饰 - 淡蓝白色 */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[200px] h-[60px] rounded-full blur-xl opacity-20 animate-pulse"
          style={{
            top: `${10 + i * 18}%`,
            right: `${5 + i * 8}%`,
            background: "rgba(173, 216, 230, 0.9)",
            animationDelay: `${i * 1}s`,
            animationDuration: "12s",
          }}
        />
      ))}
    </div>
  ),
  afternoon: (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 温暖的阳光 - 浅金色 */}
      <div className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-55 animate-pulse"
        style={{
          top: "-200px",
          left: "5%",
          background: "radial-gradient(circle, rgba(255, 215, 0, 0.85) 0%, rgba(255, 165, 0, 0.5) 40%, rgba(255, 200, 100, 0) 70%)",
          animationDuration: "5s",
        }}
      />
      {/* 第二层光 - 温暖的金色 */}
      <div className="absolute w-[400px] h-[400px] rounded-full blur-2xl opacity-45 animate-pulse"
        style={{
          top: "-100px",
          left: "15%",
          background: "radial-gradient(circle, rgba(255, 223, 0, 0.8) 0%, rgba(255, 200, 50, 0.4) 50%, transparent 70%)",
          animationDelay: "1s",
          animationDuration: "4s",
        }}
      />
      {/* 光线散射效果 */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[150px] h-[300px] blur-xl opacity-22 animate-pulse"
          style={{
            top: "-50px",
            left: `${5 + i * 12}%`,
            transform: `rotate(${i * 5}deg)`,
            background: "linear-gradient(180deg, rgba(255, 215, 0, 0.6) 0%, transparent 100%)",
            animationDelay: `${i * 0.3}s`,
            animationDuration: "6s",
          }}
        />
      ))}
      {/* 温暖的光粒子 */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full blur-md opacity-30 animate-pulse"
          style={{
            top: `${10 + Math.random() * 60}%`,
            left: `${5 + Math.random() * 80}%`,
            background: "rgba(255, 215, 0, 0.8)",
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}
      {/* 云朵装饰 - 淡金色 */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[200px] h-[60px] rounded-full blur-xl opacity-25 animate-pulse"
          style={{
            top: `${15 + i * 20}%`,
            right: `${5 + i * 10}%`,
            background: "rgba(255, 230, 150, 0.9)",
            animationDelay: `${i * 1}s`,
            animationDuration: "10s",
          }}
        />
      ))}
    </div>
  ),
  evening: (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 日落光晕 */}
      <div className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-55"
        style={{
          bottom: "-200px",
          right: "-100px",
          background: "radial-gradient(circle, rgba(255, 140, 0, 0.85) 0%, rgba(255, 69, 0, 0) 70%)",
        }}
      />
      {/* 晚霞渐变 */}
      <div className="absolute w-[800px] h-[400px] rounded-full blur-3xl opacity-45"
        style={{
          top: "-100px",
          right: "-200px",
          background: "linear-gradient(180deg, rgba(255, 165, 0, 0.55) 0%, rgba(255, 105, 180, 0.35) 50%, transparent 100%)",
        }}
      />
      {/* 光束 */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[300px] h-[300px] rounded-full blur-2xl opacity-32 animate-pulse"
          style={{
            bottom: `${10 + i * 12}%`,
            left: `${-5 + i * 8}%`,
            background: "radial-gradient(circle, rgba(255, 140, 0, 0.65) 0%, transparent 70%)",
            animationDelay: `${i * 0.8}s`,
            animationDuration: "7s",
          }}
        />
      ))}
      {/* 柔和的光粒子 */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full blur-sm opacity-35 animate-pulse"
          style={{
            top: `${30 + i * 6}%`,
            right: `${5 + i * 9}%`,
            background: "rgba(255, 140, 0, 0.7)",
            animationDelay: `${i * 0.5}s`,
            animationDuration: "4s",
          }}
        />
      ))}
    </div>
  ),
  dusk: (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 黄昏光晕 - 深橙色到紫色 */}
      <div className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-55 animate-pulse"
        style={{
          bottom: "-200px",
          right: "-100px",
          background: "radial-gradient(circle, rgba(255, 100, 0, 0.85) 0%, rgba(147, 51, 234, 0.5) 50%, rgba(75, 0, 130, 0) 70%)",
          animationDuration: "8s",
        }}
      />
      {/* 晚霞渐变 */}
      <div className="absolute w-[800px] h-[400px] rounded-full blur-3xl opacity-45"
        style={{
          top: "-100px",
          right: "-200px",
          background: "linear-gradient(180deg, rgba(255, 69, 0, 0.5) 0%, rgba(147, 51, 234, 0.35) 50%, transparent 100%)",
        }}
      />
      {/* 光束 */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[300px] h-[300px] rounded-full blur-2xl opacity-30 animate-pulse"
          style={{
            bottom: `${10 + i * 12}%`,
            left: `${-5 + i * 8}%`,
            background: "radial-gradient(circle, rgba(255, 69, 0, 0.6) 0%, rgba(147, 51, 234, 0.3) 70%)",
            animationDelay: `${i * 0.8}s`,
            animationDuration: "7s",
          }}
        />
      ))}
    </div>
  ),
  night: (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 温暖的灯笼灯光 - 四个角落 */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[250px] h-[250px] rounded-full blur-2xl opacity-40 animate-pulse"
          style={{
            top: i % 2 === 0 ? "-80px" : "auto",
            bottom: i % 2 === 1 ? "-80px" : "auto",
            left: i < 2 ? "-80px" : "auto",
            right: i >= 2 ? "-80px" : "auto",
            background: "radial-gradient(circle, rgba(255, 140, 0, 0.9) 0%, rgba(255, 100, 0, 0.4) 50%, transparent 70%)",
            animationDelay: `${i * 0.5}s`,
            animationDuration: "5s",
          }}
        />
      ))}
      {/* 中心暖光 - 提供整体照明 */}
      <div className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-30 animate-pulse"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(255, 165, 0, 0.5) 0%, rgba(255, 100, 0, 0.2) 50%, transparent 70%)",
          animationDuration: "8s",
        }}
      />
      {/* 顶部悬挂灯笼 */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[80px] h-[80px] rounded-full blur-xl opacity-35 animate-pulse"
          style={{
            top: "5%",
            left: `${15 + i * 18}%`,
            background: "radial-gradient(circle, rgba(255, 165, 0, 1) 0%, rgba(255, 69, 0, 0.5) 50%, transparent 70%)",
            animationDelay: `${i * 0.4}s`,
            animationDuration: "4s",
          }}
        />
      ))}
      {/* 底部灯光装饰 */}
      <div className="absolute w-[600px] h-[150px] rounded-full blur-2xl opacity-25"
        style={{
          bottom: "-50px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(180deg, transparent 0%, rgba(255, 140, 0, 0.4) 50%, rgba(255, 100, 0, 0.2) 100%)",
        }}
      />
      {/* 星星 - 增加数量 */}
      {[...Array(80)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white animate-pulse"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: 0.2 + Math.random() * 0.6,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
      {/* 月亮光晕 */}
      <div className="absolute w-[150px] h-[150px] rounded-full blur-3xl opacity-40"
        style={{
          top: "10%",
          right: "15%",
          background: "radial-gradient(circle, rgba(200, 220, 255, 0.9) 0%, rgba(100, 149, 237, 0) 70%)",
        }}
      />
      {/* 星云效果 */}
      <div className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
        style={{
          bottom: "-100px",
          left: "-100px",
          background: "radial-gradient(circle, rgba(138, 43, 226, 0.5) 0%, rgba(75, 0, 130, 0) 70%)",
        }}
      />
      <div className="absolute w-[300px] h-[300px] rounded-full blur-3xl opacity-20"
        style={{
          top: "30%",
          right: "-50px",
          background: "radial-gradient(circle, rgba(65, 105, 225, 0.5) 0%, rgba(25, 25, 112, 0) 70%)",
        }}
      />
    </div>
  ),
}

export function BackgroundEffects() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day")
  const [backgroundMode, setBackgroundMode] = useState<"auto" | "manual">("auto")
  const [manualBg, setManualBg] = useState<{ timeOfDay: TimeOfDay } | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // 加载用户配置
    const userProfile = storage.get<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
    setBackgroundMode(userProfile.backgroundMode || "auto")
    
    // 兼容旧数据：如果manualBackground包含weather，只取timeOfDay
    if (userProfile.manualBackground) {
      setManualBg({ timeOfDay: userProfile.manualBackground.timeOfDay })
    }

    // 获取时间段
    const getTimeOfDay = (): TimeOfDay => {
      const hour = new Date().getHours()
      if (hour >= 4 && hour < 6) return "dawn"
      if (hour >= 6 && hour < 9) return "morning"
      if (hour >= 9 && hour < 12) return "day"
      if (hour >= 12 && hour < 16) return "afternoon"
      if (hour >= 16 && hour < 18) return "evening"
      if (hour >= 18 && hour < 20) return "dusk"
      return "night"
    }

    // 根据用户配置决定使用自动还是手动模式
    if (userProfile.backgroundMode === "manual" && userProfile.manualBackground) {
      // 手动模式：使用用户选择的时间
      setTimeOfDay(userProfile.manualBackground.timeOfDay)
    } else {
      // 自动模式：根据当前时间检测
      setTimeOfDay(getTimeOfDay())
    }
  }, [])

  // 定期更新时间（仅自动模式）
  useEffect(() => {
    const updateBackground = () => {
      const userProfile = storage.get<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
      
      // 只在自动模式下更新
      if (userProfile.backgroundMode !== "auto") {
        return
      }

      // 获取时间段
      const hour = new Date().getHours()
      let newTimeOfDay: TimeOfDay
      if (hour >= 4 && hour < 6) newTimeOfDay = "dawn"
      else if (hour >= 6 && hour < 9) newTimeOfDay = "morning"
      else if (hour >= 9 && hour < 12) newTimeOfDay = "day"
      else if (hour >= 12 && hour < 16) newTimeOfDay = "afternoon"
      else if (hour >= 16 && hour < 18) newTimeOfDay = "evening"
      else if (hour >= 18 && hour < 20) newTimeOfDay = "dusk"
      else newTimeOfDay = "night"

      // 更新时间
      setTimeOfDay(newTimeOfDay)
    }

    // 立即执行一次
    updateBackground()

    // 每分钟更新一次
    const interval = setInterval(updateBackground, 60000)

    return () => clearInterval(interval)
  }, [])

  // 监听自定义事件（当用户保存设置时）
  useEffect(() => {
    const handleSettingsUpdate = () => {
      console.log('[Background] Settings update event received')
      const userProfile = storage.get<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
      console.log('[Background] User profile:', userProfile)
      
      setBackgroundMode(userProfile.backgroundMode || "auto")
      
      if (userProfile.manualBackground) {
        setManualBg({ timeOfDay: userProfile.manualBackground.timeOfDay })
      }

      if (userProfile.backgroundMode === "manual" && userProfile.manualBackground) {
        console.log('[Background] Manual mode:', userProfile.manualBackground)
        setTimeOfDay(userProfile.manualBackground.timeOfDay)
      } else {
        // 自动模式：根据当前时间
        const hour = new Date().getHours()
        if (hour >= 4 && hour < 6) setTimeOfDay("dawn")
        else if (hour >= 6 && hour < 9) setTimeOfDay("morning")
        else if (hour >= 9 && hour < 12) setTimeOfDay("day")
        else if (hour >= 12 && hour < 16) setTimeOfDay("afternoon")
        else if (hour >= 16 && hour < 18) setTimeOfDay("evening")
        else if (hour >= 18 && hour < 20) setTimeOfDay("dusk")
        else setTimeOfDay("night")
      }
    }

    window.addEventListener('profile-settings-updated', handleSettingsUpdate)
    return () => window.removeEventListener('profile-settings-updated', handleSettingsUpdate)
  }, [])

  // 根据时间段自动调整字体颜色和主题
  useEffect(() => {
    // 设置 data-time-of-day 属性，用于CSS动态调整
    document.documentElement.setAttribute('data-time-of-day', timeOfDay)
    
    // 只在夜间时段使用深色主题，其他时段使用浅色主题
    const isDarkTheme = timeOfDay === "night"
    if (isDarkTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [timeOfDay])

  const theme = BACKGROUND_THEMES[timeOfDay]

  // 客户端挂载前不渲染
  if (!isMounted) {
    return <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-500 to-purple-600 transition-all duration-1000" />
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* 主背景渐变 */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: theme.from,
        }}
      />

      {/* 第二层渐变叠加 */}
      <div
        className="absolute inset-0 opacity-50 transition-all duration-1000"
        style={{
          background: theme.to,
          mixBlendMode: "overlay",
        }}
      />

      {/* 强调色光晕 */}
      {theme.accent && (
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-30 transition-all duration-1000"
          style={{
            top: "-200px",
            right: "-200px",
            background: theme.accent,
          }}
        />
      )}

      {/* 时间段特定的装饰元素 */}
      {DECORATION_ELEMENTS[timeOfDay]}
    </div>
  )
}
