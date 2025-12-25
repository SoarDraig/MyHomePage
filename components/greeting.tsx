"use client"

import { useEffect, useState } from "react"

export function Greeting() {
  const [greeting, setGreeting] = useState<string>("")

  useEffect(() => {
    const hour = new Date().getHours()

    if (hour >= 5 && hour < 12) {
      setGreeting("早上好")
    } else if (hour >= 12 && hour < 18) {
      setGreeting("下午好")
    } else if (hour >= 18 && hour < 22) {
      setGreeting("晚上好")
    } else {
      setGreeting("夜深了")
    }
  }, [])

  return <h2 className="text-3xl md:text-4xl text-foreground font-light text-center">{greeting}，云螭</h2>
}
