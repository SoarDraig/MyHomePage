"use client";

import { useEffect, useState } from "react";

export function Greeting() {
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if it's weekend (Saturday = 6 or Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setGreeting("周末快乐");
      return;
    }

    // For weekdays, use time-based greeting
    const hour = now.getHours();

    if (hour >= 5 && hour < 8) {
      setGreeting("早上好");
    } else if (hour >= 8 && hour < 12) {
      setGreeting("上午好");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("下午好");
    } else if (hour >= 18 && hour < 22) {
      setGreeting("晚上好");
    } else if (hour >= 22 || hour < 1) {
      setGreeting("夜深了");
    } else {
      setGreeting("该睡了");
    }
  }, []);

  return (
    <h2 className="text-3xl md:text-4xl text-foreground font-light text-center">
      {greeting}，云螭
    </h2>
  );
}
