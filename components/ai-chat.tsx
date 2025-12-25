"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Settings, Plus, Trash2, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export function AIChat() {
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

      {showSettings && (
        <Card className="mb-4 p-4 bg-white/10 backdrop-blur-md border-white/20 max-h-80 overflow-y-auto custom-scrollbar">
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
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-slate-600 dark:text-slate-400 py-8">
                使用 {currentConfig.name} 开始对话...
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl backdrop-blur-md ${
                    message.role === "user"
                      ? "bg-blue-500/80 text-white"
                      : "bg-white/10 text-slate-800 dark:text-white border border-white/20"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-slate-800 dark:text-white border border-white/20 p-3 rounded-2xl backdrop-blur-md">
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
              className="flex-1 bg-white/10 backdrop-blur-md border-white/20 text-slate-800 dark:text-white placeholder:text-slate-500"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
