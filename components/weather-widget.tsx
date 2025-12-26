"use client"

import { useState, useEffect } from "react"
import { Cloud, Sun, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Loader2, MapPin, ChevronDown, ChevronUp, Thermometer, Droplets, Wind, Clock as ClockIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { chinaProvinces } from "@/lib/china-cities"
import { storage, STORAGE_KEYS, DEFAULT_USER_PROFILE } from "@/lib/storage"

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

interface WeatherResponse {
  adcode: string
  city: string
  humidity: number
  province: string
  report_time: string
  temperature: number
  weather: string
  wind_direction: string
  wind_power: string
  code?: string
  message?: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSelector, setShowSelector] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState("北京")
  const [selectedCity, setSelectedCity] = useState("北京市")
  const [isVisible, setIsVisible] = useState(true)
  const { toast } = useToast()

  // 从用户配置中读取是否显示天气
  useEffect(() => {
    const userProfile = storage.get(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
    setIsVisible(userProfile.showWeather !== false)

    // 监听配置更新
    const handleProfileUpdate = () => {
      const updatedProfile = storage.get(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE)
      setIsVisible(updatedProfile.showWeather !== false)
    }
    window.addEventListener('profile-settings-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-settings-updated', handleProfileUpdate)
  }, [])

  // 获取当前省份的城市列表
  const currentProvince = chinaProvinces.find(p => p.name === selectedProvince)
  const cities = currentProvince?.cities || []

  // 从本地存储加载上次选择的城市
  useEffect(() => {
    if (isVisible) {
      const savedCity = localStorage.getItem("weather-city")
      if (savedCity) {
        fetchWeather(savedCity)
      } else {
        // 默认加载北京的天气
        fetchWeather("北京市")
      }
    }
  }, [isVisible])

  const fetchWeather = async (city: string) => {
    if (!city.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      const data: WeatherResponse = await response.json()

      if (response.status === 410) {
        toast({
          title: "地区无效",
          description: "该地区不受支持或无法识别",
          variant: "destructive"
        })
        setLoading(false)
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
      setLoading(false)
    }
  }

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province)
    // 选择省份时，默认选择该省的第一个城市并立即查询
    const provinceData = chinaProvinces.find(p => p.name === province)
    if (provinceData && provinceData.cities.length > 0) {
      const firstCity = provinceData.cities[0]
      setSelectedCity(firstCity)
      fetchWeather(firstCity)
    }
  }

  const handleCityChange = (city: string) => {
    if (selectedCity === city) {
      // 如果选择的是当前城市，直接关闭选择器
      setShowSelector(false)
      return
    }
    setSelectedCity(city)
    fetchWeather(city)
    setShowSelector(false) // 选择城市后关闭选择器
  }

  const handleLocationClick = () => {
    setShowSelector(!showSelector)
  }

  const getWeatherIcon = (weather: string) => {
    const weatherLower = weather.toLowerCase()
    
    if (weatherLower.includes("雨") || weatherLower.includes("rain")) {
      return <CloudRain className="w-5 h-5" />
    }
    if (weatherLower.includes("雪") || weatherLower.includes("snow")) {
      return <CloudSnow className="w-5 h-5" />
    }
    if (weatherLower.includes("雷") || weatherLower.includes("thunder")) {
      return <CloudLightning className="w-5 h-5" />
    }
    if (weatherLower.includes("云") || weatherLower.includes("cloud")) {
      return <Cloud className="w-5 h-5" />
    }
    if (weatherLower.includes("晴") || weatherLower.includes("sun")) {
      return <Sun className="w-5 h-5" />
    }
    return <Cloud className="w-5 h-5" />
  }

  if (!isVisible) return null

  return (
    <div className="glass-card p-5 rounded-2xl min-w-[300px] backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/20">
      {/* 地区选择器 - 默认隐藏 */}
      {showSelector && (
        <div className="mb-4 p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
          <div className="flex gap-3">
            {/* 省份选择 */}
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

            {/* 城市选择 */}
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
      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-3 text-primary" />
          <span className="text-sm font-medium">加载天气中...</span>
        </div>
      ) : weather ? (
        <div className="space-y-4">
          {/* 地区信息 - 点击可切换选择器 */}
          <div 
            className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
            onClick={handleLocationClick}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/20 rounded-lg">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold">
                {weather.province === weather.city ? weather.city : `${weather.province} ${weather.city}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
                {weather.weather}
              </Badge>
              <div className="p-1.5 bg-white/10 rounded-lg">
                {showSelector ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>

          {/* 温度和天气图标 */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                {getWeatherIcon(weather.weather)}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {weather.temperature}
                  </span>
                  <span className="text-xl font-medium text-muted-foreground">°C</span>
                </div>
              </div>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 bg-background/40 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="p-1.5 mb-2 bg-blue-500/20 rounded-lg">
                <Droplets className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground mb-1">湿度</span>
              <span className="text-lg font-bold text-foreground">{weather.humidity}%</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-background/40 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="p-1.5 mb-2 bg-green-500/20 rounded-lg">
                <Wind className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-xs text-muted-foreground mb-1">风向</span>
              <span className="text-lg font-bold text-foreground">{weather.wind_direction}</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-background/40 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="p-1.5 mb-2 bg-purple-500/20 rounded-lg">
                <ClockIcon className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-xs text-muted-foreground mb-1">更新</span>
              <span className="text-lg font-bold text-foreground">
                {weather.report_time.split(" ")[1]?.slice(0, 5) || "--:--"}
              </span>
            </div>
          </div>

          {/* 风力信息 */}
          <div className="flex items-center justify-center p-3 bg-background/40 backdrop-blur-sm rounded-xl border border-white/10">
            <Thermometer className="w-4 h-4 text-orange-500 mr-2" />
            <span className="text-xs text-muted-foreground mr-2">风力</span>
            <span className="text-lg font-bold text-foreground">{weather.wind_power}级</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
