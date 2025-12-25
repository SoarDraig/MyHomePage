"use client"

import { useState, type FormEvent } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SearchEngine = "google" | "bing" | "baidu" | "sogou" | "360" | "yahoo"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [searchEngine, setSearchEngine] = useState<SearchEngine>("google")
  const [isFocused, setIsFocused] = useState(false)

  const searchEngines = {
    google: { name: "Google", url: "https://www.google.com/search?q=" },
    bing: { name: "Bing", url: "https://www.bing.com/search?q=" },
    baidu: { name: "百度", url: "https://www.baidu.com/s?wd=" },
    sogou: { name: "搜狗", url: "https://www.sogou.com/web?query=" },
    "360": { name: "360", url: "https://www.so.com/s?q=" },
    yahoo: { name: "雅虎", url: "https://search.yahoo.com/search?p=" },
  }

  const handleSearch = () => {
    if (!query.trim()) return
    const searchUrl = searchEngines[searchEngine].url + encodeURIComponent(query)
    window.open(searchUrl, "_blank")
    setQuery("")
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className={`glass-card rounded-full p-2 flex items-center gap-2 transition-all duration-300 ${
        isFocused ? "scale-105 shadow-2xl border-white/50" : ""
      }`}>
        <Select value={searchEngine} onValueChange={(value) => setSearchEngine(value as SearchEngine)}>
          <SelectTrigger 
            className="w-32 h-9 border-0 bg-white/5 hover:bg-white/10 backdrop-blur-md text-sm font-medium focus:ring-0 focus:ring-offset-0"
            onClick={() => setIsFocused(true)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-card">
            {Object.entries(searchEngines).map(([key, engine]) => (
              <SelectItem key={key} value={key} className="text-sm">
                {engine.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            onClick={() => setSearchEngine("google")}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Google
          </button>
        </div>
      </div>
    </form>
  )
}
