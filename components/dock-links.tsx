"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, Edit2, Settings, Dock } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { storage, STORAGE_KEYS, DEFAULT_USER_PROFILE } from "@/lib/storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Link {
  id: string
  title: string
  url: string
  icon?: string
}

const DEFAULT_LINKS: Link[] = [
  { id: "1", title: "Google", url: "https://www.google.com" },
  { id: "2", title: "GitHub", url: "https://github.com" },
  { id: "3", title: "YouTube", url: "https://www.youtube.com" },
]

const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return ""
  }
}

export function DockLinks() {
  const isMobile = useIsMobile()
  const [links, setLinks] = useState<Link[]>(DEFAULT_LINKS)
  const [isEditing, setIsEditing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [formData, setFormData] = useState({ title: "", url: "", icon: "" })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null) // 移动端点击激活的链接
  const [functionMode, setFunctionMode] = useState(true) // 功能模式状态
  const [isVisible, setIsVisible] = useState(isMobile) // 移动端默认显示
  const [isHovering, setIsHovering] = useState(false)
  const [editModeAnimating, setEditModeAnimating] = useState(false) // 编辑模式动画状态
  const [exitingEditMode, setExitingEditMode] = useState(false) // 退出编辑模式标志

  useEffect(() => {
    const saved = localStorage.getItem("quickLinks")
    if (saved) {
      setLinks(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("quickLinks", JSON.stringify(links))
  }, [links])

  // 监听功能模式变化
  useEffect(() => {
    const loadFunctionMode = () => {
      const userProfile = storage.get(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
      setFunctionMode(userProfile.functionMode !== false)
    }

    loadFunctionMode()

    const handleProfileUpdate = () => {
      loadFunctionMode()
    }

    window.addEventListener('profile-settings-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-settings-updated', handleProfileUpdate)
  }, [])

  useEffect(() => {
    // 移动端始终显示，不监听鼠标事件
    if (isMobile) {
      setIsVisible(true)
      return
    }

    // 功能模式关闭时始终显示
    if (!functionMode) {
      setIsVisible(true)
      return
    }

    // 桌面端功能模式开启时监听鼠标移动
    const handleMouseMove = (e: MouseEvent) => {
      const distanceFromBottom = window.innerHeight - e.clientY
      if (distanceFromBottom < 120) {
        setIsVisible(true)
      } else if (!isHovering && !isEditing) {
        setIsVisible(false)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isHovering, isEditing, isMobile, functionMode])

  useEffect(() => {
    if (isEditing) {
      setIsVisible(true)
      setEditModeAnimating(true)
      setHoveredIndex(null) // 进入编辑模式时清除悬停状态
      setExitingEditMode(false) // 进入编辑模式时重置退出标志
      const timer = setTimeout(() => setEditModeAnimating(false), 300)
      return () => clearTimeout(timer)
    } else {
      // 退出编辑模式时清除悬停状态
      setHoveredIndex(null)
      setExitingEditMode(true) // 设置退出标志
      // 300ms 后重置退出标志，与动画时间一致
      const timer = setTimeout(() => setExitingEditMode(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isEditing])

  const handleAddLink = () => {
    if (!formData.title || !formData.url) return

    const newLink: Link = {
      id: Date.now().toString(),
      title: formData.title,
      url: formData.url.startsWith("http") ? formData.url : `https://${formData.url}`,
      icon: formData.icon || undefined,
    }

    setLinks([...links, newLink])
    setFormData({ title: "", url: "", icon: "" })
    setIsDialogOpen(false)
  }

  const handleEditLink = () => {
    if (!editingLink || !formData.title || !formData.url) return

    setLinks(
      links.map((link) =>
        link.id === editingLink.id
          ? {
              ...link,
              title: formData.title,
              url: formData.url.startsWith("http") ? formData.url : `https://${formData.url}`,
              icon: formData.icon || undefined,
            }
          : link,
      ),
    )
    setEditingLink(null)
    setFormData({ title: "", url: "", icon: "" })
    setIsDialogOpen(false)
  }

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id))
  }

  const openEditDialog = (link: Link) => {
    setEditingLink(link)
    setFormData({ title: link.title, url: link.url, icon: link.icon || "" })
    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingLink(null)
    setFormData({ title: "", url: "", icon: "" })
    setIsDialogOpen(true)
  }

  const handleLinkClick = (link: Link, index: number) => {
    // 移动端点击链接显示编辑按钮
    if (isMobile && isEditing) {
      setActiveLinkId(activeLinkId === link.id ? null : link.id)
      setHoveredIndex(activeLinkId === link.id ? null : index)
    }
  }

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1
    const distance = Math.abs(index - hoveredIndex)
    if (distance === 0) return 1.25
    if (distance === 1) return 1.08
    return 1
  }

  return (
    <>
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        } ${isMobile ? "md:hidden" : ""}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex items-end gap-4">
          {links.map((link, index) => (
            <div key={link.id} className="relative group">
              {/* 桌面端编辑模式下显示删除按钮 */}
              {isEditing && !isMobile && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 animate-fade-in-down">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7 rounded-full shadow-lg"
                    onClick={() => handleDeleteLink(link.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 rounded-full shadow-lg"
                    onClick={() => openEditDialog(link)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* 移动端编辑模式下，点击链接显示删除按钮 */}
              {isEditing && isMobile && (
                <div className={`absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 transition-all duration-300 ease-out ${
                  activeLinkId === link.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7 rounded-full shadow-lg"
                    onClick={() => handleDeleteLink(link.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 rounded-full shadow-lg"
                    onClick={() => openEditDialog(link)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!isEditing ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center"
                  onMouseEnter={() => !isMobile && !exitingEditMode && setHoveredIndex(index)}
                  onMouseLeave={() => !isMobile && !exitingEditMode && setHoveredIndex(null)}
                >
                  <div
                    className={`w-16 h-16 flex items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer ${
                      hoveredIndex === index
                        ? "bg-white/50 backdrop-blur-2xl border-2 border-white/70 shadow-2xl shadow-primary/40"
                        : hoveredIndex === null
                          ? "bg-white/25 backdrop-blur-2xl border border-white/40 shadow-xl"
                          : "bg-transparent border-0 shadow-none"
                    }`}
                    style={{
                      transform: `scale(${!isEditing ? getScale(index) : 1}) translateY(${!isEditing && hoveredIndex === index ? "-12px" : "0px"})`,
                      transformOrigin: "bottom",
                      transition: "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease-out, border 200ms ease-out, background-color 200ms ease-out, box-shadow 200ms ease-out, backdrop-filter 200ms ease-out",
                    }}
                  >
                    {link.icon ? (
                      <span className="text-3xl">{link.icon}</span>
                    ) : (
                      <img
                        src={getFaviconUrl(link.url) || "/placeholder.svg"}
                        alt={link.title}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement
                          target.style.display = "none"
                        }}
                      />
                    )}
                  </div>
                  <span className="absolute -top-14 left-1/2 -translate-x-1/2 text-xs bg-black/90 text-white px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    {link.title}
                  </span>
                </a>
              ) : (
                <div
                  className="flex flex-col items-center"
                  onClick={() => {
                    if (isMobile) {
                      handleLinkClick(link, index)
                    }
                  }}
                >
                  <div
                    className={`w-16 h-16 flex items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer bg-white/25 backdrop-blur-2xl border border-white/40 shadow-xl`}
                  >
                    {link.icon ? (
                      <span className="text-3xl">{link.icon}</span>
                    ) : (
                      <img
                        src={getFaviconUrl(link.url) || "/placeholder.svg"}
                        alt={link.title}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement
                          target.style.display = "none"
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 添加按钮 - 移动端始终显示，桌面端编辑模式显示 */}
          {(isEditing || isMobile) && (
            <>
              <div className="w-px h-12 bg-white/30 mx-1" />
              <Dialog 
                open={isDialogOpen} 
                onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  // 关闭对话框时清除悬停状态
                  if (!open && isEditing) {
                    setHoveredIndex(null)
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openAddDialog}
                    className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-2xl hover:bg-white/35 border border-white/40 shadow-xl"
                  >
                    <Plus className="h-8 w-8" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background/95 backdrop-blur-xl border-white/20">
                  <DialogHeader>
                    <DialogTitle>{editingLink ? "编辑链接" : "添加链接"}</DialogTitle>
                    <DialogDescription>{editingLink ? "修改链接信息" : "添加一个新的快捷链接"}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">标题</Label>
                      <Input
                        id="title"
                        placeholder="Google"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-white/5 border-white/10 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">网址</Label>
                      <Input
                        id="url"
                        placeholder="https://www.google.com"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="bg-white/5 border-white/10 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="icon">图标（emoji，留空则使用网站图标）</Label>
                      <Input
                        id="icon"
                        placeholder="留空自动获取网站图标"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="bg-white/5 border-white/10 focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={editingLink ? handleEditLink : handleAddLink}>
                      {editingLink ? "保存" : "添加"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* 桌面端编辑按钮 - 齿轮形状，随 dock 栏显示 */}
      {!isMobile && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(!isEditing)}
            className={`w-14 h-14 rounded-full backdrop-blur-xl hover:bg-white/30 transition-all duration-300 ease-out shadow-xl border ${
              isEditing ? "bg-white/30 scale-110 rotate-180 border-white/40" : "bg-white/15 rotate-0 border-white/30"
            }`}
          >
            <Settings className="h-8 w-8 transition-transform duration-300" />
          </Button>
        </div>
      )}
    </>
  )
}
