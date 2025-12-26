/**
 * 统一的存储管理系统
 * 支持本地存储、导出/导入、以及为云同步预留接口
 */

// 存储键名常量
export const STORAGE_KEYS: Record<string, string> = {
  AI_CONFIGS: "ai_configs",
  AI_CURRENT_CONFIG: "ai_current_config_id",
  AI_CHAT_HISTORY: "ai_chat_history", // 预留：聊天历史
  TODOS: "todos",
  QUICK_LINKS: "quickLinks",
  THEME: "theme", // 主题偏好
  SETTINGS_VERSION: "settings_version", // 配置版本号
  USER_PROFILE: "user_profile", // 用户个人配置
  WEATHER_CITY: "weather-city", // 天气：城市
};

// 用户个人配置类型
export interface UserProfile {
  nickname: string; // 昵称
  avatar?: string; // 头像URL（预留）
  customGreetings?: { // 自定义问候语（预留）
    morning?: string;
    afternoon?: string;
    evening?: string;
    night?: string;
    weekend?: string;
  };
  timezone?: string; // 时区（预留）
  dateFormat?: string; // 日期格式（预留）
  showClock?: boolean; // 是否显示时钟
  showGreeting?: boolean; // 是否显示问候语
  showWeather?: boolean; // 是否显示天气组件
  language?: string; // 语言（预留）
  backgroundMode?: "auto" | "manual"; // 背景模式：自动或手动
  manualBackground?: {
    timeOfDay: "dawn" | "morning" | "day" | "afternoon" | "evening" | "dusk" | "night";
    weather: "sunny" | "cloudy" | "rainy" | "snowy";
  };
  functionMode?: boolean; // 功能模式：开启显示AI助手和聚合中心，关闭只显示基础功能
  darkMode?: boolean; // 深色模式：开启后强制显示深夜背景效果
}

// 默认用户配置
export const DEFAULT_USER_PROFILE: UserProfile = {
  nickname: "云螭",
  showClock: true,
  showGreeting: true,
  showWeather: true,
  language: "zh-CN",
  backgroundMode: "auto",
  manualBackground: {
    timeOfDay: "day",
    weather: "sunny",
  },
  functionMode: true, // 默认开启功能模式
  darkMode: false, // 默认关闭深色模式
};

// 配置版本号，用于数据迁移
export const SETTINGS_VERSION = "1.0.0";

// 完整配置类型
export type AppConfig = {
  version: string;
  aiConfigs: any[];
  aiCurrentConfigId: string;
  todos: any[];
  quickLinks: any[];
  theme?: string;
  userProfile: UserProfile;
  exportedAt: string;
};

/**
 * 安全的localStorage操作工具
 */
export const storage = {
  /**
   * 获取数据
   */
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`[Storage] Failed to get ${key}:`, error);
      return defaultValue;
    }
  },

  /**
   * 设置数据
   */
  set<T>(key: string, value: T): boolean {
    if (typeof window === "undefined") return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Storage] Failed to set ${key}:`, error);
      return false;
    }
  },

  /**
   * 删除数据
   */
  remove(key: string): boolean {
    if (typeof window === "undefined") return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Storage] Failed to remove ${key}:`, error);
      return false;
    }
  },

  /**
   * 清空所有配置数据
   */
  clearAll(): boolean {
    if (typeof window === "undefined") return false;
    
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error("[Storage] Failed to clear all:", error);
      return false;
    }
  },
};

/**
 * 配置导出功能
 */
export const configExport = {
  /**
   * 导出所有配置到JSON文件
   */
  exportToFile(): void {
    const config: AppConfig = {
      version: SETTINGS_VERSION,
      aiConfigs: storage.get(STORAGE_KEYS.AI_CONFIGS, []),
      aiCurrentConfigId: storage.get(STORAGE_KEYS.AI_CURRENT_CONFIG, ""),
      todos: storage.get(STORAGE_KEYS.TODOS, []),
      quickLinks: storage.get(STORAGE_KEYS.QUICK_LINKS, []),
      theme: storage.get(STORAGE_KEYS.THEME, ""),
      userProfile: storage.get<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE),
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `myhomepage-config-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * 导出配置为JSON字符串
   */
  exportToString(): string {
    const config: AppConfig = {
      version: SETTINGS_VERSION,
      aiConfigs: storage.get(STORAGE_KEYS.AI_CONFIGS, []),
      aiCurrentConfigId: storage.get(STORAGE_KEYS.AI_CURRENT_CONFIG, ""),
      todos: storage.get(STORAGE_KEYS.TODOS, []),
      quickLinks: storage.get(STORAGE_KEYS.QUICK_LINKS, []),
      theme: storage.get(STORAGE_KEYS.THEME, ""),
      userProfile: storage.get<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(config, null, 2);
  },
};

/**
 * 配置导入功能
 */
export const configImport = {
  /**
   * 从文件导入配置
   */
  importFromFile(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          this.importFromString(content);
          resolve(true);
        } catch (error) {
          console.error("[Storage] Failed to parse import file:", error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsText(file);
    });
  },

  /**
   * 从JSON字符串导入配置
   */
  importFromString(jsonString: string): void {
    try {
      const config: AppConfig = JSON.parse(jsonString);
      
      // 验证配置格式
      if (!config.version) {
        throw new Error("Invalid config format: missing version");
      }
      
      // 导入各项配置
      if (config.aiConfigs) {
        storage.set(STORAGE_KEYS.AI_CONFIGS, config.aiConfigs);
      }
      if (config.aiCurrentConfigId) {
        storage.set(STORAGE_KEYS.AI_CURRENT_CONFIG, config.aiCurrentConfigId);
      }
      if (config.todos) {
        storage.set(STORAGE_KEYS.TODOS, config.todos);
      }
      if (config.quickLinks) {
        storage.set(STORAGE_KEYS.QUICK_LINKS, config.quickLinks);
      }
      if (config.theme) {
        storage.set(STORAGE_KEYS.THEME, config.theme);
      }
      if (config.userProfile) {
        storage.set(STORAGE_KEYS.USER_PROFILE, config.userProfile);
      }
      
      // 更新版本号
      storage.set(STORAGE_KEYS.SETTINGS_VERSION, SETTINGS_VERSION);
      
      console.log("[Storage] Configuration imported successfully");
      
      // 刷新页面以应用新配置
      window.location.reload();
    } catch (error) {
      console.error("[Storage] Failed to import config:", error);
      throw error;
    }
  },

  /**
   * 验证配置文件
   */
  validateConfig(jsonString: string): { valid: boolean; error?: string; version?: string } {
    try {
      const config = JSON.parse(jsonString);
      
      if (!config.version) {
        return { valid: false, error: "Missing version field" };
      }
      
      return { valid: true, version: config.version };
    } catch (error) {
      return { valid: false, error: "Invalid JSON format" };
    }
  },
};

/**
 * 云同步预留接口
 * 未来可以扩展为真正的云同步功能
 */
export const cloudSync = {
  /**
   * 检查云同步是否可用（预留）
   */
  isAvailable(): boolean {
    return false; // 暂时禁用
  },

  /**
   * 上传配置到云端（预留）
   */
  async upload(): Promise<boolean> {
    console.warn("[CloudSync] Cloud sync is not yet implemented");
    return false;
  },

  /**
   * 从云端下载配置（预留）
   */
  async download(): Promise<boolean> {
    console.warn("[CloudSync] Cloud sync is not yet implemented");
    return false;
  },

  /**
   * 同步配置（预留）
   */
  async sync(): Promise<boolean> {
    console.warn("[CloudSync] Cloud sync is not yet implemented");
    return false;
  },
};

/**
 * 数据迁移工具
 * 用于处理版本升级时的数据格式转换
 */
export const migration = {
  /**
   * 检查是否需要迁移
   */
  needsMigration(): boolean {
    const currentVersion = storage.get<string>(STORAGE_KEYS.SETTINGS_VERSION, "");
    return currentVersion !== SETTINGS_VERSION;
  },

  /**
   * 执行数据迁移
   */
  migrate(): void {
    // 预留：未来版本升级时需要的数据迁移逻辑
    console.log("[Migration] Current version is up to date");
  },
};

/**
 * 初始化存储系统
 */
export function initializeStorage(): void {
  // 设置当前版本号
  if (!storage.get(STORAGE_KEYS.SETTINGS_VERSION, "")) {
    storage.set(STORAGE_KEYS.SETTINGS_VERSION, SETTINGS_VERSION);
  }
  
  // 检查是否需要迁移
  if (migration.needsMigration()) {
    migration.migrate();
  }
}
