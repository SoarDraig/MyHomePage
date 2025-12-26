"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, X, Cloud, Calendar, Bookmark, MapPin, ChevronDown, ChevronUp, Droplets, Wind, Thermometer, Clock as ClockIcon, CloudRain, CloudSnow, CloudLightning, Sun, Briefcase, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { chinaProvinces } from "@/lib/china-cities"
import { useToast } from "@/hooks/use-toast"
import { storage, STORAGE_KEYS, DEFAULT_USER_PROFILE, WorkTimeConfig } from "@/lib/storage"

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

interface WeatherData {
  adcode: string
  city: string
  humidity: number
  province: string
  report_time: string
  temperature: number
  weather: string
  wind_direction: string
  wind_power: string
}

export function AggregationCenter() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState("worktime")
  const { toast } = useToast()
  
  // 待办事项状态
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [shatteringId, setShatteringId] = useState<string | null>(null)
  
  // 天气状态
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [showWeatherSelector, setShowWeatherSelector] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState("北京")
  const [selectedCity, setSelectedCity] = useState("北京市")
  const [isVisible, setIsVisible] = useState(true)
  
  // 下班助手状态
  const [workStartTime, setWorkStartTime] = useState("")
  const [workEndTime, setWorkEndTime] = useState("")
  const [workHours, setWorkHours] = useState(9)
  const [remainingTime, setRemainingTime] = useState("")
  const [timeStatus, setTimeStatus] = useState<"normal" | "almost" | "done">("normal")
  const [showSettings, setShowSettings] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  
  // 检查是否在允许的时间段内（9:00-21:00）
  const isWorkTimeAvailable = useMemo(() => {
    const now = new Date()
    const currentHour = now.getHours()
    return currentHour >= 9 && currentHour < 21
  }, [currentTime])

  // 初始化工作时间和时长的持久化数据
  useEffect(() => {
    const savedWorkStartTime = storage.get<string>(STORAGE_KEYS.WORK_START_TIME, "")
    const savedWorkHours = storage.get<number>(STORAGE_KEYS.WORK_HOURS, 9)
    const savedWorkDate = storage.get<string>(STORAGE_KEYS.WORK_DATE, "")
    
    // 获取今天的日期
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
    
    // 恢复上班时间和工作时长（持久化）
    if (savedWorkStartTime) {
      setWorkStartTime(savedWorkStartTime)
    }
    if (savedWorkHours) {
      setWorkHours(savedWorkHours)
    }
    
    // 保存今天的日期
    if (savedWorkDate !== todayStr) {
      storage.set(STORAGE_KEYS.WORK_DATE, todayStr)
    }
  }, [])

  // 当工作时间和工作时长都恢复后，自动计算下班时间
  useEffect(() => {
    if (workStartTime && workHours) {
      const [hours, minutes] = workStartTime.split(":").map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        const startDate = new Date()
        startDate.setHours(hours, minutes, 0, 0)
        
        const endDate = new Date(startDate.getTime() + workHours * 60 * 60 * 1000)
        const endHours = endDate.getHours().toString().padStart(2, '0')
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0')
        
        setWorkEndTime(`${endHours}:${endMinutes}`)
      }
    }
  }, [workStartTime, workHours])

  // 初始化待办事项
  useEffect(() => {
    const saved = localStorage.getItem("todos")
    if (saved) {
      setTodos(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos))
  }, [todos])
  
  // 天气相关效果
  useEffect(() => {
    const userProfile = storage.get(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
    setIsVisible(userProfile.showWeather !== false)

    const handleProfileUpdate = () => {
      const updatedProfile = storage.get(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
      setIsVisible(updatedProfile.showWeather !== false)
    }
    window.addEventListener('profile-settings-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-settings-updated', handleProfileUpdate)
  }, [])

  const currentProvince = chinaProvinces.find(p => p.name === selectedProvince)
  const cities = currentProvince?.cities || []

  useEffect(() => {
    if (isVisible) {
      const savedCity = localStorage.getItem("weather-city")
      if (savedCity) {
        fetchWeather(savedCity)
      } else {
        fetchWeather("北京市")
      }
    }
  }, [isVisible])

  const fetchWeather = async (city: string) => {
    if (!city.trim()) return

    setWeatherLoading(true)
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      const data = await response.json()

      if (response.status === 410) {
        toast({
          title: "地区无效",
          description: "该地区不受支持或无法识别",
          variant: "destructive"
        })
        setWeatherLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.message || "获取天气失败")
      }

      setWeather(data)
      localStorage.setItem("weather-city", city)
    } catch (error) {
      console.error("Failed to fetch weather:", error)
      toast({
        title: "获取天气失败",
        description: "请稍后重试或检查城市名称",
        variant: "destructive"
      })
    } finally {
      setWeatherLoading(false)
    }
  }

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province)
    const provinceData = chinaProvinces.find(p => p.name === province)
    if (provinceData && provinceData.cities.length > 0) {
      const firstCity = provinceData.cities[0]
      setSelectedCity(firstCity)
      fetchWeather(firstCity)
    }
  }

  const handleCityChange = (city: string) => {
    if (selectedCity === city) {
      setShowWeatherSelector(false)
      return
    }
    setSelectedCity(city)
    fetchWeather(city)
    setShowWeatherSelector(false)
  }

  const handleLocationClick = () => {
    setShowWeatherSelector(!showWeatherSelector)
  }

  const getWeatherIcon = (weather: string) => {
    const weatherLower = weather.toLowerCase()
    
    if (weatherLower.includes("雨") || weatherLower.includes("rain")) {
      return <CloudRain className="w-8 h-8" />
    }
    if (weatherLower.includes("雪") || weatherLower.includes("snow")) {
      return <CloudSnow className="w-8 h-8" />
    }
    if (weatherLower.includes("雷") || weatherLower.includes("thunder")) {
      return <CloudLightning className="w-8 h-8" />
    }
    if (weatherLower.includes("云") || weatherLower.includes("cloud")) {
      return <Cloud className="w-8 h-8" />
    }
    if (weatherLower.includes("晴") || weatherLower.includes("sun")) {
      return <Sun className="w-8 h-8" />
    }
    return <Cloud className="w-8 h-8" />
  }

  const handleAddTodo = () => {
    if (!newTodo.trim()) return

    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setTodos([todo, ...todos])
    setNewTodo("")
  }

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const handleDeleteTodo = (id: string) => {
    setShatteringId(id)
    setTimeout(() => {
      setDeletingId(id)
      setShatteringId(null)
      setTimeout(() => {
        setTodos(todos.filter((todo) => todo.id !== id))
        setDeletingId(null)
      }, 300)
    }, 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddTodo()
    }
  }

  // 计算下班时间
  const calculateEndTime = () => {
    if (!workStartTime) return

    const [hours, minutes] = workStartTime.split(":").map(Number)
    if (isNaN(hours) || isNaN(minutes)) {
      toast({
        title: "时间格式错误",
        description: "请输入正确的时间格式（HH:MM）",
        variant: "destructive"
      })
      return
    }

    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate.getTime() + workHours * 60 * 60 * 1000)
    const endHours = endDate.getHours().toString().padStart(2, '0')
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0')
    
    setWorkEndTime(`${endHours}:${endMinutes}`)
  }

  const handleStartTimeChange = (value: string) => {
    setWorkStartTime(value)
    if (value) {
      const [hours, minutes] = value.split(":").map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        const startDate = new Date()
        startDate.setHours(hours, minutes, 0, 0)
        
        const endDate = new Date(startDate.getTime() + workHours * 60 * 60 * 1000)
        const endHours = endDate.getHours().toString().padStart(2, '0')
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0')
        
        setWorkEndTime(`${endHours}:${endMinutes}`)
        
        // 保存工作时间到 localStorage
        storage.set(STORAGE_KEYS.WORK_START_TIME, value)
      }
    } else {
      setWorkEndTime("")
      storage.remove(STORAGE_KEYS.WORK_START_TIME)
    }
  }

  const handleWorkHoursChange = (value: string) => {
    const hours = parseFloat(value)
    if (hours > 0 && hours <= 24) {
      setWorkHours(hours)
      // 保存工作时长到 localStorage
      storage.set(STORAGE_KEYS.WORK_HOURS, hours)
      if (workStartTime) {
        calculateEndTime()
      }
    }
  }

  // 实时更新当前时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // 实时更新剩余时间和状态
  useEffect(() => {
    if (!workEndTime) return

    const updateTime = () => {
      const now = new Date()
      
      // 计算当前时间距离下班的时间差
      const [endHours, endMinutes] = workEndTime.split(":").map(Number)
      const endTime = new Date()
      endTime.setHours(endHours, endMinutes, 0, 0)
      
      const diffMs = endTime.getTime() - now.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      // 格式化剩余时间
      if (diffMinutes <= 0) {
        setRemainingTime("0分钟")
        setTimeStatus("done")
      } else {
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        
        if (hours > 0) {
          setRemainingTime(`${hours}小时${minutes}分钟`)
        } else {
          setRemainingTime(`${minutes}分钟`)
        }

        // 状态判断：超过下班时间（绿），剩余30分钟内（黄），其他（红）
        if (diffMinutes <= 30) {
          setTimeStatus("almost")
        } else {
          setTimeStatus("normal")
        }
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000) // 每秒更新

    return () => clearInterval(interval)
  }, [workEndTime])

  // 根据状态获取颜色主题
  const getStatusTheme = () => {
    switch (timeStatus) {
      case "done":
        return {
          bg: "from-green-500/10 to-green-500/5",
          text: "from-green-600 to-green-400",
          icon: "text-green-500",
          label: "text-green-600 dark:text-green-400",
          iconBg: "bg-green-500/20",
          progress: "from-green-500 to-green-400"
        }
      case "almost":
        return {
          bg: "from-yellow-500/10 to-yellow-500/5",
          text: "from-yellow-600 to-yellow-400",
          icon: "text-yellow-500",
          label: "text-yellow-600 dark:text-yellow-400",
          iconBg: "bg-yellow-500/20",
          progress: "from-yellow-500 to-yellow-400"
        }
      default:
        return {
          bg: "from-red-500/10 to-red-500/5",
          text: "from-red-600 to-red-400",
          icon: "text-red-500",
          label: "text-red-600 dark:text-red-400",
          iconBg: "bg-red-500/20",
          progress: "from-red-500 to-red-400"
        }
    }
  }

  const theme = getStatusTheme()

  const completedCount = todos.filter(t => t.completed).length
  const totalCount = todos.length

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-foreground">聚合中心</h2>
        {activeTab === "todos" && totalCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 mb-4 bg-white/15 backdrop-blur-md border border-white/30">
          <TabsTrigger 
            value="worktime" 
            className="flex items-center gap-1.5 data-[state=active]:bg-white/30 hover:bg-white/25 hover:scale-105 transition-all duration-200"
          >
            <Briefcase className="w-4 h-4" />
            下班助手
          </TabsTrigger>
          <TabsTrigger 
            value="weather" 
            className="flex items-center gap-1.5 data-[state=active]:bg-white/30 hover:bg-white/25 hover:scale-105 transition-all duration-200"
          >
            <Cloud className="w-4 h-4" />
            天气
          </TabsTrigger>
          <TabsTrigger 
            value="todos" 
            className="relative data-[state=active]:bg-white/30 hover:bg-white/25 hover:scale-105 transition-all duration-200"
          >
            待办事项
            {totalCount > 0 && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {totalCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="bookmarks" 
            className="flex items-center gap-1.5 data-[state=active]:bg-white/30 hover:bg-white/25 hover:scale-105 transition-all duration-200"
          >
            <Bookmark className="w-4 h-4" />
            书签
          </TabsTrigger>
        </TabsList>

        <TabsContent value="worktime" className="flex-1 mt-0">
          <div className="h-full flex flex-col">
            {!isWorkTimeAvailable ? (
              /* 不在工作时间 */
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <ClockIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  下班助手服务时间
                </p>
                <p className="text-sm text-muted-foreground">
                  09:00 - 21:00
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  当前时间：{currentTime}
                </p>
              </div>
            ) : workStartTime && workEndTime ? (
              <>
                {/* 主显示区域 - 下班时间 */}
                <div className="flex-1 flex flex-col items-center justify-center py-8 relative">
                  <div className="relative">
                    {/* 装饰性背景圆圈 */}
                    <div className={`absolute inset-0 flex items-center justify-center`}>
                      <div className={`w-48 h-48 rounded-full bg-gradient-to-br ${theme.bg} animate-pulse`} />
                    </div>
                    
                    {/* 时间显示 */}
                    <div className="relative text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className={`p-2 ${theme.iconBg} rounded-lg`}>
                          <ClockIcon className={`w-5 h-5 ${theme.icon}`} />
                        </div>
                        <span className={`text-sm font-medium ${theme.label}`}>
                          {timeStatus === "done" ? "下班啦！" : timeStatus === "almost" ? "快下班了！" : "下班倒计时"}
                        </span>
                      </div>
                      
                      <div className={`text-7xl font-bold bg-gradient-to-br ${theme.text} bg-clip-text text-transparent tracking-tight`}>
                        {workEndTime}
                      </div>
                      
                      <p className="mt-3 text-sm text-muted-foreground">
                        {timeStatus === "done" ? "可以下班了" : `工作 ${workHours} 小时后下班`}
                      </p>
                    </div>
                  </div>

                  {/* 剩余时间 */}
                  <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {timeStatus === "done" ? "已下班" : "距离下班"}
                    </p>
                    <p className={`text-2xl font-semibold ${theme.label}`}>{remainingTime}</p>
                  </div>

                  {/* 工作进度 */}
                  <div className="mt-8 w-full max-w-xs">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>已工作</span>
                      <span>剩余</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${theme.progress} rounded-full transition-all duration-500`}
                        style={{ width: '0%' }}
                      />
                    </div>
                  </div>

                  {/* 设置按钮 - 右下角齿轮 */}
                  <div className="absolute bottom-4 right-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all hover:scale-110"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* 设置面板 - 默认隐藏 */}
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>工作时间设置</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-2 block">
                            上班时间
                          </label>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-primary" />
                            <span className="font-semibold">09:{workStartTime.split(":")[1] || "00"}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-2 block">
                            工作时长
                          </label>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-orange-500" />
                            <span className="font-semibold">{workHours} 小时</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-white/10">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full hover:bg-white/10"
                          onClick={() => {
                            setWorkStartTime("")
                            setWorkEndTime("")
                            // 清除持久化的数据
                            storage.remove(STORAGE_KEYS.WORK_START_TIME)
                            storage.remove(STORAGE_KEYS.WORK_HOURS)
                            setShowSettings(false)
                          }}
                        >
                          重新设置
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                {/* 设置模式 */}
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <div className="text-center mb-6">
                    <Briefcase className="w-16 h-16 mx-auto mb-4 text-primary/60" />
                    <h3 className="text-xl font-semibold mb-2">设置您的工作时间</h3>
                    <p className="text-sm text-muted-foreground">上班时间：9:00-10:00</p>
                  </div>

                  {/* 上班时间输入 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">上班分钟数（1-59）</label>
                    <select
                      value={workStartTime.split(":")[1] || ""}
                      onChange={(e) => {
                        const minutes = e.target.value.padStart(2, '0')
                        handleStartTimeChange(`09:${minutes}`)
                      }}
                      className="w-full h-12 px-3 text-lg bg-white/5 border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                    >
                      <option value="">选择分钟</option>
                      {Array.from({ length: 59 }, (_, i) => (
                        <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                          {(i + 1).toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 工作时长选择 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">工作时长</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[7, 8, 9, 9.5, 10, 11, 12, 13].map((hours) => (
                        <button
                          key={hours}
                          onClick={() => handleWorkHoursChange(hours.toString())}
                          className={`p-3 rounded-xl text-sm font-medium transition-all ${
                            workHours === hours
                              ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                              : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                          }`}
                        >
                          {hours}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 自定义时长 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">自定义时长</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        value={workHours}
                        onChange={(e) => handleWorkHoursChange(e.target.value)}
                        placeholder="小时"
                        className="flex-1 h-10 bg-white/5 border-2 border-primary/30 focus:border-primary"
                      />
                      <span className="flex items-center text-sm text-muted-foreground">小时</span>
                    </div>
                  </div>

                  {/* 快速预设 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">快速预设</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { time: "09:00", hours: 9, label: "9:00上班9小时" },
                        { time: "09:15", hours: 9, label: "9:15上班9小时" },
                        { time: "09:30", hours: 9, label: "9:30上班9小时" },
                        { time: "09:45", hours: 9, label: "9:45上班9小时" },
                        { time: "10:00", hours: 9, label: "10:00上班9小时" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => {
                            handleStartTimeChange(preset.time)
                            handleWorkHoursChange(preset.hours.toString())
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all hover:scale-105"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="weather" className="flex-1 mt-0">
          {!isVisible ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>天气功能已关闭</p>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* 地区选择器 */}
              {showWeatherSelector && (
                <div className="mb-4 p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">省份</label>
                      <select
                        value={selectedProvince}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full h-9 px-3 text-sm bg-background border-2 border-primary/30 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        {chinaProvinces.map((province) => (
                          <option key={province.name} value={province.name}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">城市</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => handleCityChange(e.target.value)}
                        disabled={cities.length === 0}
                        className="w-full h-9 px-3 text-sm bg-background border-2 border-primary/30 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                      >
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 天气信息 */}
              {weatherLoading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm font-medium">加载天气中...</span>
                  </div>
                </div>
              ) : weather ? (
                <div className="flex-1 flex flex-col space-y-4">
                  {/* 地区信息 */}
                  <div 
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl cursor-pointer hover:from-primary/15 hover:to-primary/10 transition-all"
                    onClick={handleLocationClick}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">
                        {weather.province === weather.city ? weather.city : `${weather.province} ${weather.city}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {weather.weather}
                      </Badge>
                      <div className="p-1 bg-white/10 rounded-lg">
                        {showWeatherSelector ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 主要天气信息 - 大卡片 */}
                  <div className="flex-1 flex flex-col justify-center p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-white/20">
                    <div className="flex items-center justify-center gap-6">
                      <div className="p-4 bg-primary/30 rounded-2xl">
                        {getWeatherIcon(weather.weather)}
                      </div>
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-2 mb-2">
                          <span className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            {weather.temperature}
                          </span>
                          <span className="text-3xl font-medium text-muted-foreground">°C</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{weather.weather}</p>
                      </div>
                    </div>
                  </div>

                  {/* 详细信息网格 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-4 bg-background/40 backdrop-blur-sm rounded-xl border border-white/10">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Droplets className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">湿度</p>
                        <p className="text-xl font-bold">{weather.humidity}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-background/40 backdrop-blur-sm rounded-xl border border-white/10">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Wind className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">风向</p>
                        <p className="text-xl font-bold">{weather.wind_direction}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-background/40 backdrop-blur-sm rounded-xl border border-white/10">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Thermometer className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">风力</p>
                        <p className="text-xl font-bold">{weather.wind_power}级</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-background/40 backdrop-blur-sm rounded-xl border border-white/10">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <ClockIcon className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">更新</p>
                        <p className="text-xl font-bold">
                          {weather.report_time.split(" ")[1]?.slice(0, 5) || "--:--"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p>暂无天气数据</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todos" className="flex-1 flex flex-col mt-0">
          {/* 添加任务区域 */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="添加新任务..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-white/5 border-white/10 focus:border-primary/50"
            />
            <Button size="sm" onClick={handleAddTodo} disabled={!newTodo.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 任务列表 */}
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 ease-out group ${
                  isMobile ? "" : "hover:bg-white/20"
                } ${shatteringId === todo.id ? "animate-glass-shatter" : deletingId === todo.id ? "opacity-0 scale-0" : "animate-fade-in"}`}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={todo.completed} onCheckedChange={() => handleToggleTodo(todo.id)} className="mt-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm break-words ${
                      todo.completed ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {todo.text}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 transition-all duration-300 shrink-0 hover:scale-110 hover:rotate-90 ${
                    isMobile
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  } ${shatteringId === todo.id ? "opacity-0" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (shatteringId !== todo.id) {
                      handleDeleteTodo(todo.id)
                    }
                  }}
                  disabled={shatteringId === todo.id}
                >
                  <X className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}

            {todos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>暂无待办事项</p>
                <p className="text-sm mt-1">输入任务按回车添加</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 书签模块（预留） */}
        <TabsContent value="bookmarks" className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <Bookmark className="w-12 h-12 mb-4 opacity-50" />
          <p>书签模块（预留）</p>
          <p className="text-xs mt-2">即将推出</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
