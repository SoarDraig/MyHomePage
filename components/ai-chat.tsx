"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Settings, Plus, Trash2, Check, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"

type AIConfig = {
  id: string
  name: string
  apiKey: string
  apiUrl: string
  model: string
}

const DEFAULT_CONFIGS: AIConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    apiKey: "",
    apiUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
]

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

const QUOTES = [
  { text: "生活就像骑自行车，想要保持平衡就得不断前进。", author: "爱因斯坦" },
  { text: "人生没有白走的路，每一步都算数。", author: "未知" },
  { text: "今天的努力，是明天的铺路石。", author: "未知" },
  { text: "学习不是为了知道更多，而是为了变得更智慧。", author: "苏格拉底" },
  { text: "与其临渊羡鱼，不如退而结网。", author: "淮南子" },
  { text: "读万卷书，行万里路。", author: "刘希夷" },
  { text: "知之者不如好之者，好之者不如乐之者。", author: "孔子" },
  { text: "学而不思则罔，思而不学则殆。", author: "孔子" },
  { text: "天行健，君子以自强不息。", author: "易经" },
  { text: "路漫漫其修远兮，吾将上下而求索。", author: "屈原" },
  { text: "己所不欲，勿施于人。", author: "孔子" },
  { text: "三人行，必有我师焉。", author: "孔子" },
  { text: "宝剑锋从磨砺出，梅花香自苦寒来。", author: "未知" },
  { text: "不积跬步，无以至千里。", author: "荀子" },
  { text: "千里之行，始于足下。", author: "老子" },
]

export function AIChat() {
  const [currentQuote, setCurrentQuote] = useState(QUOTES[0])
  const [configs, setConfigs] = useState<AIConfig[]>(DEFAULT_CONFIGS)
  const [currentConfigId, setCurrentConfigId] = useState<string>("openai")
  const [showSettings, setShowSettings] = useState(false)
  const [isAddingConfig, setIsAddingConfig] = useState(false)
  const [newConfigName, setNewConfigName] = useState("")

  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedConfigs = localStorage.getItem("ai_configs")
    const savedCurrentId = localStorage.getItem("ai_current_config_id")

    if (savedConfigs) {
      setConfigs(JSON.parse(savedConfigs))
    }
    if (savedCurrentId) {
      setCurrentConfigId(savedCurrentId)
    }
  }, [])

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length)
    setCurrentQuote(QUOTES[randomIndex])
  }, [])

  const currentConfig = configs.find((c) => c.id === currentConfigId) || configs[0]
  const isConfigured = currentConfig && currentConfig.apiKey

  const handleSaveConfig = () => {
    if (!editingConfig) return

    const updatedConfigs = configs.map((c) => (c.id === editingConfig.id ? editingConfig : c))
    setConfigs(updatedConfigs)
    localStorage.setItem("ai_configs", JSON.stringify(updatedConfigs))
    setEditingConfig(null)
    setShowSettings(false)
  }

  const handleAddConfig = () => {
    if (!newConfigName.trim()) return

    const newConfig: AIConfig = {
      id: Date.now().toString(),
      name: newConfigName,
      apiKey: "",
      apiUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
    }

    const updatedConfigs = [...configs, newConfig]
    setConfigs(updatedConfigs)
    localStorage.setItem("ai_configs", JSON.stringify(updatedConfigs))
    setCurrentConfigId(newConfig.id)
    localStorage.setItem("ai_current_config_id", newConfig.id)
    setEditingConfig(newConfig)
    setIsAddingConfig(false)
    setNewConfigName("")
  }

  const handleDeleteConfig = (id: string) => {
    if (configs.length <= 1) return

    const updatedConfigs = configs.filter((c) => c.id !== id)
    setConfigs(updatedConfigs)
    localStorage.setItem("ai_configs", JSON.stringify(updatedConfigs))

    if (currentConfigId === id) {
      setCurrentConfigId(updatedConfigs[0].id)
      localStorage.setItem("ai_current_config_id", updatedConfigs[0].id)
    }
  }

  const handleSwitchConfig = (id: string) => {
    setCurrentConfigId(id)
    localStorage.setItem("ai_current_config_id", id)
    setMessages([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !isConfigured) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": currentConfig.apiKey,
          "x-api-url": currentConfig.apiUrl,
          "x-model": currentConfig.model,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("API request failed")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                accumulatedContent += content
                setMessages((prev) => {
                  const newMessages = [...prev]
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage.role === "assistant") {
                    lastMessage.content = accumulatedContent
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Chat error:", error)
      setMessages((prev) => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage.role === "assistant") {
          lastMessage.content = "抱歉，发生了错误。请检查您的API配置。"
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">AI 助手</h2>
          <Select value={currentConfigId} onValueChange={handleSwitchConfig}>
            <SelectTrigger className="w-32 bg-white/10 border-white/20 text-slate-800 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/20">
              {configs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 glass-card">
            <span className="text-sm text-foreground/80 italic">
              "{currentQuote.text}"
            </span>
            <span className="text-xs text-foreground/60">— {currentQuote.author}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const randomIndex = Math.floor(Math.random() * QUOTES.length)
                setCurrentQuote(QUOTES[randomIndex])
              }}
              className="h-5 w-5 text-foreground/50 hover:text-foreground/80 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowSettings(!showSettings)
              if (!showSettings) {
                setEditingConfig(currentConfig)
              }
            }}
            className="text-slate-600 dark:text-slate-300 hover:bg-white/20"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {showSettings && (
        <Card className="mb-4 p-4 glass-card max-h-80 overflow-y-auto custom-scrollbar animate-slide-down">
          <div className="space-y-4">
            {/* 配置列表 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">配置管理</label>
                <Button variant="ghost" size="sm" onClick={() => setIsAddingConfig(true)} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  添加配置
                </Button>
              </div>

              {isAddingConfig && (
                <div className="flex gap-2">
                  <Input
                    value={newConfigName}
                    onChange={(e) => setNewConfigName(e.target.value)}
                    placeholder="配置名称（如：DeepSeek, Kimi）"
                    className="flex-1 bg-white/10 border-white/20 text-slate-800 dark:text-white"
                  />
                  <Button onClick={handleAddConfig} size="sm">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                      config.id === currentConfigId
                        ? "bg-blue-500/30 border-blue-500/50"
                        : "bg-white/10 border-white/20"
                    } border`}
                  >
                    <span className="text-slate-800 dark:text-white">{config.name}</span>
                    {configs.length > 1 && (
                      <button onClick={() => handleDeleteConfig(config.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 当前配置编辑 */}
            {editingConfig && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">API Key</label>
                  <Input
                    type="password"
                    value={editingConfig.apiKey}
                    onChange={(e) => setEditingConfig({ ...editingConfig, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="mt-1 bg-white/10 border-white/20 text-slate-800 dark:text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">API URL</label>
                  <Input
                    value={editingConfig.apiUrl}
                    onChange={(e) => setEditingConfig({ ...editingConfig, apiUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="mt-1 bg-white/10 border-white/20 text-slate-800 dark:text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">模型</label>
                  <Input
                    value={editingConfig.model}
                    onChange={(e) => setEditingConfig({ ...editingConfig, model: e.target.value })}
                    placeholder="gpt-4o-mini"
                    className="mt-1 bg-white/10 border-white/20 text-slate-800 dark:text-white placeholder:text-slate-500"
                  />
                </div>
                <Button onClick={handleSaveConfig} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  保存设置
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {!isConfigured && !showSettings && (
        <div className="flex-1 flex items-center justify-center text-center p-6">
          <div className="text-slate-600 dark:text-slate-400">
            <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>请先配置 API 设置</p>
          </div>
        </div>
      )}

      {isConfigured && (
        <>
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-slate-600 dark:text-slate-400 py-8">
                使用 {currentConfig.name} 开始对话...
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] ${
                    message.role === "user"
                      ? "bg-blue-500/80 text-white glass-card"
                      : "glass-card text-slate-800 dark:text-white"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none
                      prose-headings:my-1 prose-headings:text-lg prose-headings:font-semibold prose-headings:text-foreground
                      prose-p:my-0.5 prose-p:leading-snug prose-p:text-base
                      prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0 prose-li:text-base prose-li:leading-relaxed
                      prose-strong:font-semibold prose-em:italic
                      prose-code:text-pink-400 prose-code:bg-pink-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
                      prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-700 prose-pre:p-3 prose-pre:rounded-lg prose-pre:my-1 prose-pre:max-h-96 prose-pre:overflow-x-auto
                      prose-blockquote:border-l-3 prose-blockquote:border-blue-400 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:my-1 prose-blockquote:text-base
                      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:text-sm
                      prose-table:my-1 prose-table:border prose-table:border-slate-600 prose-table:text-sm
                      prose-th:border prose-th:border-slate-600 prose-th:bg-slate-800/50 prose-th:px-2 prose-th:py-1
                      prose-td:border prose-td:border-slate-600 prose-td:px-2 prose-td:py-1
                      prose-hr:border-slate-600 prose-hr:my-1 prose-hr:border-t
                      prose-img:my-1 prose-img:rounded-lg prose-img:max-w-full
                      !prose-p:text-foreground
                      !prose-ul:text-foreground
                      !prose-ol:text-foreground
                      !prose-li:text-foreground
                      !prose-blockquote:text-foreground
                      !prose-hr:border-slate-500
                      dark:prose-code:text-pink-300
                      dark:prose-a:text-blue-300
                      dark:prose-th:bg-slate-700/50
                      dark:prose-pre:bg-slate-800/90">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="glass-card text-slate-800 dark:text-white p-3 rounded-2xl animate-glass-shimmer">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入消息..."
              disabled={isLoading}
              className="flex-1 glass-card text-slate-800 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 hover:scale-[1.01]"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 glass-card"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
