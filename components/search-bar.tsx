"use client"

import { useState, type FormEvent } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const handleSearch = (engine: "google" | "bing") => {
    if (!query.trim()) return

    const searchUrl =
      engine === "google"
        ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
        : `https://www.bing.com/search?q=${encodeURIComponent(query)}`

    window.open(searchUrl, "_blank")
    setQuery("")
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleSearch("google")
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className={`glass-card rounded-full p-2 flex items-center gap-2 transition-all duration-300 ease-out ${
        isFocused ? "scale-105 shadow-2xl border-white/50 animate-glass-shimmer" : ""
      }`}>
        <Search className={`w-5 h-5 text-foreground/70 ml-2 transition-all duration-300 ${isFocused ? "animate-glass-bounce" : ""}`} />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="搜索..."
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handleSearch("google")}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSearch("bing")}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Bing
          </button>
        </div>
      </div>
    </form>
  )
}
