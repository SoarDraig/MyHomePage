"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Download, Upload, Trash2, RefreshCw, Cloud, User } from "lucide-react"
import { configExport, configImport, storage, STORAGE_KEYS, cloudSync, DEFAULT_USER_PROFILE, type UserProfile } from "@/lib/storage"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isCloudSyncing, setIsCloudSyncing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  // 用户配置状态
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE)
  const [hasChanges, setHasChanges] = useState(false)
  
  useEffect(() => {
    // 加载用户配置
    const profile = storage.get<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
    setUserProfile(profile)
  }, [isOpen])

  // 保存用户配置
  const handleSaveProfile = () => {
    console.log('[Settings] Saving profile:', userProfile)
    storage.set(STORAGE_KEYS.USER_PROFILE, userProfile)
    setHasChanges(false)
    
    // 触发自定义事件通知背景组件更新
    const event = new CustomEvent('profile-settings-updated', { 
      detail: { userProfile } 
    })
    console.log('[Settings] Dispatching event:', event)
    window.dispatchEvent(event)
    console.log('[Settings] Event dispatched successfully')
    
    toast({
      title: "保存成功",
      description: "个人配置已更新",
    })
  }
  
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
              管理您的AI配置、待办事项、快捷链接和个人配置
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">个人配置</TabsTrigger>
              <TabsTrigger value="data">数据管理</TabsTrigger>
              <TabsTrigger value="backup">备份恢复</TabsTrigger>
            </TabsList>

            {/* 个人配置标签页 */}
            <TabsContent value="profile" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>昵称</Label>
                  <Input
                    value={userProfile.nickname}
                    onChange={(e) => {
                      setUserProfile({ ...userProfile, nickname: e.target.value })
                      setHasChanges(true)
                    }}
                    placeholder="请输入昵称"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-greeting">显示问候语</Label>
                    <Checkbox
                      id="show-greeting"
                      checked={userProfile.showGreeting !== false}
                      onCheckedChange={(checked) => {
                        setUserProfile({ ...userProfile, showGreeting: checked as boolean })
                        setHasChanges(true)
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-clock">显示时钟</Label>
                    <Checkbox
                      id="show-clock"
                      checked={userProfile.showClock !== false}
                      onCheckedChange={(checked) => {
                        setUserProfile({ ...userProfile, showClock: checked as boolean })
                        setHasChanges(true)
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-weather">显示天气</Label>
                    <Checkbox
                      id="show-weather"
                      checked={userProfile.showWeather !== false}
                      onCheckedChange={(checked) => {
                        setUserProfile({ ...userProfile, showWeather: checked as boolean })
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </div>

                <Separator />

                {/* 背景设置 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bg-mode">背景模式</Label>
                    <select
                      id="bg-mode"
                      value={userProfile.backgroundMode || "auto"}
                      onChange={(e) => {
                        setUserProfile({ 
                          ...userProfile, 
                          backgroundMode: e.target.value as "auto" | "manual"
                        })
                        setHasChanges(true)
                      }}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="auto">自动（根据时间）</option>
                      <option value="manual">手动</option>
                    </select>
                  </div>

                  {userProfile.backgroundMode === "manual" && (
                    <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="space-y-2">
                        <Label>时间段</Label>
                        <select
                          value={userProfile.manualBackground?.timeOfDay || "day"}
                          onChange={(e) => {
                            setUserProfile({
                              ...userProfile,
                              manualBackground: {
                                ...userProfile.manualBackground!,
                                timeOfDay: e.target.value as "dawn" | "morning" | "day" | "afternoon" | "evening" | "dusk" | "night"
                              }
                            })
                            setHasChanges(true)
                          }}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full"
                        >
                          <option value="dawn">黎明（4:00-6:00）</option>
                          <option value="morning">早晨（6:00-9:00）</option>
                          <option value="day">上午（9:00-12:00）</option>
                          <option value="afternoon">下午（12:00-16:00）</option>
                          <option value="evening">傍晚（16:00-18:00）</option>
                          <option value="dusk">黄昏（18:00-20:00）</option>
                          <option value="night">夜晚（20:00-4:00）</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {hasChanges && (
                  <Button
                    onClick={handleSaveProfile}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    保存配置
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* 数据管理标签页 */}
            <TabsContent value="data" className="space-y-6 mt-6">
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
            </TabsContent>

            {/* 备份恢复标签页 */}
            <TabsContent value="backup" className="space-y-6 mt-6">
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
            </TabsContent>
          </Tabs>
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
