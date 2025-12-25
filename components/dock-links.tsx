"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, Edit2 } from "lucide-react"
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
  const [links, setLinks] = useState<Link[]>(DEFAULT_LINKS)
  const [isEditing, setIsEditing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [formData, setFormData] = useState({ title: "", url: "", icon: "" })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("quickLinks")
    if (saved) {
      setLinks(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("quickLinks", JSON.stringify(links))
  }, [links])

  useEffect(() => {
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
  }, [isHovering, isEditing])

  useEffect(() => {
    if (isEditing) {
      setIsVisible(true)
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

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1
    const distance = Math.abs(index - hoveredIndex)
    if (distance === 0) return 1.5
    if (distance === 1) return 1.15
    return 1
  }

  return (
    <>
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex items-end gap-4">
          {links.map((link, index) => (
            <div key={link.id} className="relative group">
              {isEditing && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className={`w-16 h-16 flex items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer ${
                    hoveredIndex === index
                      ? "bg-white/40 backdrop-blur-xl border-2 border-white/60 shadow-2xl shadow-primary/30"
                      : hoveredIndex === null
                        ? "bg-white/15 backdrop-blur-xl border border-white/30 shadow-xl"
                        : "bg-transparent border-0 shadow-none"
                  }`}
                  style={{
                    transform: `scale(${getScale(index)}) translateY(${hoveredIndex === index ? "-16px" : "0px"})`,
                    transformOrigin: "bottom",
                    transition: "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-out, border 300ms ease-out, background-color 300ms ease-out, box-shadow 300ms ease-out, backdrop-filter 300ms ease-out",
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
            </div>
          ))}

          {isEditing && (
            <>
              <div className="w-px h-12 bg-white/30 mx-1" />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openAddDialog}
                    className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xl hover:bg-white/25 border border-white/30 shadow-xl"
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

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(!isEditing)}
          className={`w-14 h-14 rounded-full backdrop-blur-xl hover:bg-white/30 transition-all shadow-xl border ${
            isEditing ? "bg-white/30 scale-110 border-white/40" : "bg-white/15 border-white/30"
          }`}
        >
          <Edit2 className="h-6 w-6" />
        </Button>
      </div>
    </>
  )
}
