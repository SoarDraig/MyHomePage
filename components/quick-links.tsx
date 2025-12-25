"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, X, Edit2, ExternalLink } from "lucide-react"
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

export function QuickLinks() {
  const [links, setLinks] = useState<Link[]>(DEFAULT_LINKS)
  const [isEditing, setIsEditing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [formData, setFormData] = useState({ title: "", url: "", icon: "" })

  useEffect(() => {
    const saved = localStorage.getItem("quickLinks")
    if (saved) {
      setLinks(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("quickLinks", JSON.stringify(links))
  }, [links])

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-foreground text-center flex-1">快捷导航</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" onClick={openAddDialog}>
                <Plus className="h-4 w-4" />
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
                <Button onClick={editingLink ? handleEditLink : handleAddLink}>{editingLink ? "保存" : "添加"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
        {links.map((link) => (
          <div key={link.id} className="relative group">
            {isEditing && (
              <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 rounded-full shadow-md"
                  onClick={() => handleDeleteLink(link.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 rounded-full shadow-md"
                  onClick={() => openEditDialog(link)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="p-4 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:backdrop-blur-lg transition-all duration-300 cursor-pointer h-full border-white/20 hover:scale-105 hover:shadow-xl">
                <div className="flex flex-col items-center gap-2 text-center">
                  {link.icon ? (
                    <span className="text-3xl transition-transform duration-300 group-hover:scale-125">
                      {link.icon}
                    </span>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center transition-transform duration-300 group-hover:scale-125">
                      <img
                        src={getFaviconUrl(link.url) || "/placeholder.svg"}
                        alt={link.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement
                          target.style.display = "none"
                          const parent = target.parentElement
                          if (parent && !parent.querySelector("svg")) {
                            const wrapper = document.createElement("div")
                            wrapper.innerHTML =
                              '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-muted-foreground"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>'
                            parent.appendChild(wrapper.firstChild!)
                          }
                        }}
                      />
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground truncate w-full">{link.title}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Card>
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
