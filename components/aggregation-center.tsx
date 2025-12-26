"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, Cloud, Calendar, Bookmark, MapPin, ChevronDown, ChevronUp, Droplets, Wind, Thermometer, Clock as ClockIcon, CloudRain, CloudSnow, CloudLightning, Sun } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { chinaProvinces } from "@/lib/china-cities"
import { useToast } from "@/hooks/use-toast"
import { storage, STORAGE_KEYS, DEFAULT_USER_PROFILE } from "@/lib/storage"

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
  const [activeTab, setActiveTab] = useState("todos")
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
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="weather" className="flex items-center gap-1.5">
            <Cloud className="w-4 h-4" />
            天气
          </TabsTrigger>
          <TabsTrigger value="todos" className="relative">
            待办事项
            {totalCount > 0 && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {totalCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="flex items-center gap-1.5">
            <Bookmark className="w-4 h-4" />
            书签
          </TabsTrigger>
        </TabsList>

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
