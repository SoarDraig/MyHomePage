"use client"

import { useEffect, useState } from "react"
import { storage, STORAGE_KEYS, DEFAULT_USER_PROFILE } from "@/lib/storage"

export function Clock() {
  const [hours, setHours] = useState<string>("00")
  const [minutes, setMinutes] = useState<string>("00")
  const [seconds, setSeconds] = useState<string>("00")
  const [date, setDate] = useState<string>("")
  const [showClock, setShowClock] = useState(true)

  useEffect(() => {
    // 加载用户配置
    const userProfile = storage.get(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
    setShowClock(userProfile.showClock !== false)
  }, [])
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setHours(now.getHours().toString().padStart(2, "0"))
      setMinutes(now.getMinutes().toString().padStart(2, "0"))
      setSeconds(now.getSeconds().toString().padStart(2, "0"))
      setDate(
        now.toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        }),
      )
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!showClock) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-1 text-6xl md:text-7xl font-light tracking-tight text-foreground drop-shadow-lg">
        <span className="inline-block min-w-[2.4ch] text-center tabular-nums">{hours}</span>
        <span>:</span>
        <span className="inline-block min-w-[2.4ch] text-center tabular-nums">{minutes}</span>
        <span>:</span>
        <span className="inline-block min-w-[2.4ch] text-center tabular-nums">{seconds}</span>
      </div>
      <p className="text-lg md:text-xl text-muted-foreground text-center drop-shadow-md">{date}</p>
    </div>
  )
}
