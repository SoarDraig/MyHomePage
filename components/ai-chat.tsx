"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  Settings,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  MessageSquare,
  Pin,
  MoreVertical,
  Pencil,
  Download,
  Upload,
  X,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { conversationStorage, type Conversation, type ConversationMetadata, type ChatMessage } from "@/lib/storage"

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

  // Conversation management
  const [conversations, setConversations] = useState<ConversationMetadata[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [showConversationList, setShowConversationList] = useState(true)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editTitleInput, setEditTitleInput] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Load configs from storage
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

  // Load conversations
  useEffect(() => {
    loadConversations()
  }, [])

  // Load current conversation
  useEffect(() => {
    const currentId = conversationStorage.getCurrentConversationId()
    if (currentId) {
      loadConversation(currentId)
    }
  }, [])

  // Auto-save conversation when messages change
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      conversationStorage.saveConversation({
        ...currentConversation,
        messages,
        updatedAt: Date.now(),
      })
      loadConversations() // Refresh the list
    }
  }, [messages])

  const loadConversations = () => {
    const sorted = conversationStorage.getSortedConversations()
    setConversations(sorted)
  }

  const loadConversation = (id: string) => {
    const conversation = conversationStorage.getConversation(id)
    if (conversation) {
      setCurrentConversation(conversation)
      setMessages([])
      conversationStorage.setCurrentConversationId(id)
      setEditingTitle(null)
      
      // 延迟加载消息以触发动画
      setTimeout(() => {
        setMessages(conversation.messages)
      }, 50)
    }
  }

  const createNewConversation = () => {
    const newConversation = conversationStorage.createConversation(currentConfigId)
    setCurrentConversation(newConversation)
    setMessages([])
    conversationStorage.setCurrentConversationId(newConversation.id)
    loadConversations()
    // Don't hide sidebar on desktop
    if (window.innerWidth < 768) {
      setShowConversationList(false)
    }
  }

  // Update conversation title with first question
  const updateConversationTitle = (firstQuestion: string) => {
    if (currentConversation && currentConversation.title === "新对话") {
      const truncatedTitle = firstQuestion.length > 20 
        ? firstQuestion.substring(0, 20) + "..." 
        : firstQuestion
      conversationStorage.updateTitle(currentConversation.id, truncatedTitle)
      loadConversations()
      setCurrentConversation({ ...currentConversation, title: truncatedTitle })
    }
  }

  const switchConversation = (id: string) => {
    loadConversation(id)
    setShowConversationList(false) // Hide sidebar on mobile
  }

  const handleDeleteConversation = (id: string) => {
    setConversationToDelete(id)
    setShowDeleteDialog(true)
  }

  const confirmDeleteConversation = () => {
    if (conversationToDelete) {
      conversationStorage.deleteConversation(conversationToDelete)
      if (currentConversation?.id === conversationToDelete) {
        setCurrentConversation(null)
        setMessages([])
        conversationStorage.clearCurrentConversationId()
      }
      loadConversations()
      setShowDeleteDialog(false)
      setConversationToDelete(null)
    }
  }

  const handlePinConversation = (id: string) => {
    conversationStorage.togglePin(id)
    loadConversations()
  }

  const handleStartEditTitle = (conv: ConversationMetadata) => {
    setEditingTitle(conv.id)
    setEditTitleInput(conv.title)
  }

  const handleSaveTitle = () => {
    if (editingTitle && editTitleInput.trim()) {
      conversationStorage.updateTitle(editingTitle, editTitleInput.trim())
      loadConversations()
      if (currentConversation?.id === editingTitle) {
        setCurrentConversation({ ...currentConversation, title: editTitleInput.trim() })
      }
    }
    setEditingTitle(null)
    setEditTitleInput("")
  }

  const handleExportConversation = (id: string) => {
    try {
      const json = conversationStorage.exportConversation(id)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `conversation-${id}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export conversation:", error)
    }
  }

  const handleImportConversation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string
        conversationStorage.importConversation(json)
        loadConversations()
      } catch (error) {
        console.error("Failed to import conversation:", error)
      }
    }
    reader.readAsText(file)
    e.target.value = "" // Reset input
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return "今天"
    } 
    if (days === 1) {
      return "昨天"
    }
    if (days < 7) {
      return `${days}天前`
    }
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
  }

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
    
    // Update current conversation config if exists
    if (currentConversation) {
      const updatedConversation = { ...currentConversation, configId: id }
      setCurrentConversation(updatedConversation)
      conversationStorage.saveConversation(updatedConversation)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !isConfigured) return

    // Create conversation if none exists
    let conversation = currentConversation
    if (!conversation) {
      conversation = conversationStorage.createConversation(currentConfigId)
      setCurrentConversation(conversation)
      conversationStorage.setCurrentConversationId(conversation.id)
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    conversationStorage.addMessage(conversation.id, userMessage)
    
    // Update conversation title with first question if it's a new conversation
    if (messages.length === 0) {
      updateConversationTitle(input)
    }
    
    setInput("")
    setIsLoading(true)

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      model: currentConfig.model,
    }

    setMessages((prev) => [...prev, assistantMessage])
    loadConversations()

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
                conversationStorage.updateLastMessage(conversation.id, accumulatedContent)
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
      conversationStorage.updateLastMessage(
        conversation.id,
        "抱歉，发生了错误。请检查您的API配置。"
      )
    } finally {
      setIsLoading(false)
      loadConversations()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowConversationList(!showConversationList)}
            className="text-slate-600 dark:text-slate-300 hover:bg-white/20"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
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

      <div className="flex gap-2 flex-1 overflow-hidden">
        {/* Conversation Sidebar */}
        {showConversationList && (
          <div className="w-[35%] min-w-[240px] max-w-[320px] flex-shrink-0 flex flex-col h-full animate-slide-in overflow-hidden">
            <div className="glass-card rounded-xl p-3 backdrop-blur-xl border border-white/30 dark:border-white/40 shadow-2xl flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <h3 className="text-xs font-semibold text-slate-800 dark:text-white/90 flex items-center gap-1.5">
                  <MessageSquare className="h-2.5 w-2.5 text-blue-500" />
                  对话列表
                </h3>
                <div className="flex items-center gap-0.5">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportConversation}
                    className="hidden"
                    id="import-conversation"
                  />
                  <label htmlFor="import-conversation">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-white/20 text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-all duration-300"
                      title="导入对话"
                      asChild
                    >
                      <span>
                        <Upload className="h-2.5 w-2.5" />
                      </span>
                    </Button>
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={createNewConversation}
                    className="h-4 w-4 hover:bg-white/20 text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-all duration-300"
                    title="新建对话"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 pr-2 min-h-0">
                <div className="space-y-1.5">
                  {conversations.length === 0 && (
                    <div className="text-center py-8 px-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm mb-3">
                        <MessageSquare className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">暂无对话</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">开始新的对话吧</p>
                    </div>
                  )}
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group relative overflow-hidden rounded-lg transition-all duration-300 cursor-pointer ${
                        currentConversation?.id === conv.id
                          ? "bg-transparent border-t border-r border-b border-slate-200 dark:border-white/10 border-l-4 border-l-blue-500"
                          : "hover:bg-white/80 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30"
                      }`}
                      onClick={() => switchConversation(conv.id)}
                      style={{ width: '100%', maxWidth: '100%' }}
                    >
                      {/* Glass effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:from-blue-500/5 dark:via-transparent dark:to-purple-500/5" />
                      
                      <div className="relative flex items-center gap-1 py-4 px-1">
                        {/* Avatar/Icon */}
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                          currentConversation?.id === conv.id
                            ? "bg-white/10"
                            : "bg-white/10 group-hover:bg-white/20"
                        }`}>
                          {conv.isPinned ? (
                            <Pin className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                          ) : (
                            <MessageSquare className="h-3 w-3 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          {editingTitle === conv.id ? (
                            <input
                              type="text"
                              value={editTitleInput}
                              onChange={(e) => setEditTitleInput(e.target.value)}
                              onBlur={handleSaveTitle}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveTitle()
                                if (e.key === "Escape") setEditingTitle(null)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-xs bg-white/80 dark:bg-black/40 border border-white/30 rounded px-2 py-1 focus:outline-none focus:ring-1.5 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 font-medium text-slate-800 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate leading-5">
                                  {conv.title.length > 12 ? conv.title.substring(0, 12) + '...' : conv.title}
                                </p>
                                {conv.isPinned && (
                                  <span className="inline-flex items-center px-1 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                                    已置顶
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatDate(conv.updatedAt)}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  {conv.messageCount}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 hover:bg-white/20 text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                            >
                              <MoreVertical className="h-2.5 w-2.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-card border-white/20 shadow-xl">
                            <DropdownMenuItem 
                              onClick={() => handleStartEditTitle(conv)}
                              className="hover:bg-white/20 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-2 text-slate-600 dark:text-slate-400" />
                              <span className="text-slate-700 dark:text-slate-300">重命名</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handlePinConversation(conv.id)}
                              className="hover:bg-white/20 cursor-pointer"
                            >
                              <Pin className="h-3.5 w-3.5 mr-2 text-slate-600 dark:text-slate-400" />
                              <span className="text-slate-700 dark:text-slate-300">
                                {conv.isPinned ? "取消置顶" : "置顶"}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleExportConversation(conv.id)}
                              className="hover:bg-white/20 cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5 mr-2 text-slate-600 dark:text-slate-400" />
                              <span className="text-slate-700 dark:text-slate-300">导出</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                              onClick={() => handleDeleteConversation(conv.id)}
                              className="text-red-500 hover:bg-red-500/10 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              <span>删除</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Settings Panel */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showSettings ? "max-h-80 opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"
            }`}
          >
            {showSettings && (
              <Card className="p-4 glass-card overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  {/* 配置列表 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        配置管理
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingConfig(true)}
                        className="h-7 text-xs"
                      >
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
                            <button
                              onClick={() => handleDeleteConfig(config.id)}
                              className="text-red-500 hover:text-red-700"
                            >
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
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          API Key
                        </label>
                        <Input
                          type="password"
                          value={editingConfig.apiKey}
                          onChange={(e) =>
                            setEditingConfig({ ...editingConfig, apiKey: e.target.value })
                          }
                          placeholder="sk-..."
                          className="mt-1 bg-white/10 border-white/20 text-slate-800 dark:text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          API URL
                        </label>
                        <Input
                          value={editingConfig.apiUrl}
                          onChange={(e) =>
                            setEditingConfig({ ...editingConfig, apiUrl: e.target.value })
                          }
                          placeholder="https://api.openai.com/v1"
                          className="mt-1 bg-white/10 border-white/20 text-slate-800 dark:text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          模型
                        </label>
                        <Input
                          value={editingConfig.model}
                          onChange={(e) =>
                            setEditingConfig({ ...editingConfig, model: e.target.value })
                          }
                          placeholder="gpt-4o-mini"
                          className="mt-1 bg-white/10 border-white/20 text-slate-800 dark:text-white placeholder:text-slate-500"
                        />
                      </div>
                      <Button
                        onClick={handleSaveConfig}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        保存设置
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>

          {!isConfigured && !showSettings && (
            <div className="flex-1 flex items-center justify-center text-center px-6 animate-fade-in">
              <div className="text-slate-600 dark:text-slate-400">
                <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>请先配置 API 设置</p>
              </div>
            </div>
          )}

          {isConfigured && (
            <>
              <div
                ref={messagesContainerRef}
                className={`flex-1 overflow-y-auto space-y-4 px-4 pb-4 pr-4 custom-scrollbar transition-all duration-300 ${
                  messages.length === 0 ? 'animate-fade-in' : ''
                }`}
              >
                {messages.length === 0 && (
                  <div className="text-center text-slate-600 dark:text-slate-400 py-8">
                    使用 {currentConfig.name} 开始对话...
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } animate-fade-in-up w-full`}
                  >
                    <div
                      className={`max-w-[90%] p-4 rounded-2xl backdrop-blur-md transition-all duration-300 hover:scale-[1.01] ${
                        message.role === "user"
                          ? "bg-blue-600/95 text-white shadow-lg"
                          : "glass-card text-slate-800 dark:text-white shadow-md"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none
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
                      dark:prose-pre:bg-slate-800/90"
                        >
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
                    <div className="glass-card dark:bg-white/15 text-slate-800 dark:text-white p-3 rounded-2xl animate-glass-shimmer">
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

              <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
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
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除对话</DialogTitle>
            <DialogDescription>
              此操作无法撤销。确定要删除这个对话吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDeleteConversation}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
