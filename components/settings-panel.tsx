"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Download, Upload, Trash2, RefreshCw, Cloud } from "lucide-react"
import { configExport, configImport, storage, STORAGE_KEYS, cloudSync } from "@/lib/storage"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isCloudSyncing, setIsCloudSyncing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // 导出配置
  const handleExport = () => {
    setIsExporting(true)
    try {
      configExport.exportToFile()
      toast({
        title: "导出成功",
        description: "配置已导出到JSON文件",
      })
    } catch (error) {
      toast({
        title: "导出失败",
        description: "导出配置时发生错误",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // 导入配置
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      await configImport.importFromFile(file)
      toast({
        title: "导入成功",
        description: "配置已导入，页面将刷新",
      })
    } catch (error) {
      toast({
        title: "导入失败",
        description: "配置文件格式错误或导入失败",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // 清空配置
  const handleClearAll = () => {
    try {
      storage.clearAll()
      toast({
        title: "清空成功",
        description: "所有配置已清空，页面将刷新",
      })
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      toast({
        title: "清空失败",
        description: "清空配置时发生错误",
        variant: "destructive",
      })
    }
    setShowClearDialog(false)
  }

  // 云同步（预留功能）
  const handleCloudSync = async () => {
    setIsCloudSyncing(true)
    try {
      const result = await cloudSync.sync()
      if (result) {
        toast({
          title: "云同步成功",
          description: "配置已同步到云端",
        })
      } else {
        toast({
          title: "云同步失败",
          description: "云同步功能暂未启用",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "云同步错误",
        description: "同步时发生错误",
        variant: "destructive",
      })
    } finally {
      setIsCloudSyncing(false)
    }
  }

  // 获取配置统计信息
  const getConfigStats = () => {
    const aiConfigs = storage.get(STORAGE_KEYS.AI_CONFIGS, [])
    const todos = storage.get(STORAGE_KEYS.TODOS, [])
    const quickLinks = storage.get(STORAGE_KEYS.QUICK_LINKS, [])
    
    return {
      aiConfigs: aiConfigs.length,
      todos: todos.length,
      quickLinks: quickLinks.length,
    }
  }

  const stats = getConfigStats()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 dark:text-slate-300 hover:bg-white/20"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl">配置管理</DialogTitle>
            <DialogDescription>
              管理您的AI配置、待办事项和快捷链接
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 配置统计 */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.aiConfigs}</div>
                <div className="text-xs text-muted-foreground mt-1">AI配置</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{stats.todos}</div>
                <div className="text-xs text-muted-foreground mt-1">待办事项</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">{stats.quickLinks}</div>
                <div className="text-xs text-muted-foreground mt-1">快捷链接</div>
              </div>
            </div>

            <Separator />

            {/* 导出配置 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">导出配置</Label>
              <p className="text-xs text-muted-foreground">
                将所有配置导出为JSON文件，可以备份或在其他设备上使用
              </p>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "导出中..." : "导出配置文件"}
              </Button>
            </div>

            <Separator />

            {/* 导入配置 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">导入配置</Label>
              <p className="text-xs text-muted-foreground">
                从JSON文件导入配置，将覆盖当前所有设置
              </p>
              <Button
                onClick={handleImportClick}
                disabled={isImporting}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? "导入中..." : "导入配置文件"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <Separator />

            {/* 云同步（预留功能） */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">云同步</Label>
              <p className="text-xs text-muted-foreground">
                将配置同步到云端（功能开发中）
              </p>
              <Button
                onClick={handleCloudSync}
                disabled={isCloudSyncing || !cloudSync.isAvailable()}
                variant="outline"
                className="w-full"
              >
                <Cloud className="h-4 w-4 mr-2" />
                {isCloudSyncing ? "同步中..." : "云同步配置"}
              </Button>
              {!cloudSync.isAvailable() && (
                <p className="text-xs text-muted-foreground text-center">
                  云同步功能暂未启用
                </p>
              )}
            </div>

            <Separator />

            {/* 清空配置 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-destructive">危险操作</Label>
              <p className="text-xs text-muted-foreground">
                清空所有配置数据，此操作不可恢复
              </p>
              <Button
                onClick={() => setShowClearDialog(true)}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                清空所有配置
              </Button>
            </div>

            {/* 重置到默认 */}
            <div className="space-y-2">
              <Button
                onClick={() => {
                  window.location.reload()
                }}
                variant="ghost"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新页面
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 清空确认对话框 */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空所有配置？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除所有AI配置、待办事项和快捷链接，且无法恢复。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
