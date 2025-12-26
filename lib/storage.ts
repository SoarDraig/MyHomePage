/**
 * 统一的存储管理系统
 * 支持本地存储、导出/导入、以及为云同步预留接口
 */

// 存储键名常量
export const STORAGE_KEYS: Record<string, string> = {
  AI_CONFIGS: "ai_configs",
  AI_CURRENT_CONFIG: "ai_current_config_id",
  AI_CONVERSATIONS: "ai_conversations", // 对话列表
  AI_CURRENT_CONVERSATION: "ai_current_conversation_id", // 当前对话ID
  AI_CHAT_HISTORY: "ai_chat_history", // 预留：聊天历史（已废弃）
  TODOS: "todos",
  QUICK_LINKS: "quickLinks",
  THEME: "theme", // 主题偏好
  SETTINGS_VERSION: "settings_version", // 配置版本号
  USER_PROFILE: "user_profile", // 用户个人配置
  WEATHER_CITY: "weather-city", // 天气：城市
  WORK_START_TIME: "work_start_time", // 工作开始时间
  WORK_END_TIME: "work_end_time", // 工作结束时间
  WORK_HOURS: "work_hours", // 工作时长
  WORK_DATE: "work_date", // 工作日期（用于检测是否是今天）
};

// 消息类型
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  model?: string; // 使用的模型
}

// 对话类型
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  configId: string; // 关联的AI配置ID
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean; // 是否置顶
  tags?: string[]; // 标签（预留）
}

// 对话列表元数据（用于优化性能，只存储必要信息）
export interface ConversationMetadata {
  id: string;
  title: string;
  configId: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  isPinned?: boolean;
  lastMessage?: string;
}

// 工作时间配置类型
export interface WorkTimeConfig {
  startTime: string; // 上班时间 HH:MM:SS
  endTime: string; // 下班时间 HH:MM:SS
  hours: number; // 工作时长
  date: string; // 日期 YYYY-MM-DD
}

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
 * 对话存储管理
 * 优化的对话存储和检索系统
 */
export const conversationStorage = {
  /**
   * 获取所有对话元数据（优化性能，只返回元数据）
   */
  getAllMetadata(): ConversationMetadata[] {
    const conversations = storage.get<Record<string, Conversation>>(
      STORAGE_KEYS.AI_CONVERSATIONS,
      {}
    );

    return Object.values(conversations).map((conv) => ({
      id: conv.id,
      title: conv.title,
      configId: conv.configId,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv.messages.length,
      isPinned: conv.isPinned,
      lastMessage: conv.messages[conv.messages.length - 1]?.content?.substring(0, 50) || "",
    }));
  },

  /**
   * 获取单个对话的完整数据
   */
  getConversation(id: string): Conversation | null {
    const conversations = storage.get<Record<string, Conversation>>(
      STORAGE_KEYS.AI_CONVERSATIONS,
      {}
    );
    return conversations[id] || null;
  },

  /**
   * 保存对话（创建或更新）
   */
  saveConversation(conversation: Conversation): void {
    const conversations = storage.get<Record<string, Conversation>>(
      STORAGE_KEYS.AI_CONVERSATIONS,
      {}
    );
    conversations[conversation.id] = conversation;
    storage.set(STORAGE_KEYS.AI_CONVERSATIONS, conversations);
  },

  /**
   * 创建新对话
   */
  createConversation(configId: string, title?: string): Conversation {
    const now = Date.now();
    const newConversation: Conversation = {
      id: `conv_${now}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || this.generateTitle(""),
      messages: [],
      configId,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
    };

    this.saveConversation(newConversation);
    return newConversation;
  },

  /**
   * 删除对话
   */
  deleteConversation(id: string): void {
    const conversations = storage.get<Record<string, Conversation>>(
      STORAGE_KEYS.AI_CONVERSATIONS,
      {}
    );
    delete conversations[id];
    storage.set(STORAGE_KEYS.AI_CONVERSATIONS, conversations);

    // 如果删除的是当前对话，清除当前对话ID
    const currentId = storage.get<string>(STORAGE_KEYS.AI_CURRENT_CONVERSATION, "");
    if (currentId === id) {
      storage.remove(STORAGE_KEYS.AI_CURRENT_CONVERSATION);
    }
  },

  /**
   * 切换对话置顶状态
   */
  togglePin(id: string): void {
    const conversation = this.getConversation(id);
    if (conversation) {
      conversation.isPinned = !conversation.isPinned;
      conversation.updatedAt = Date.now();
      this.saveConversation(conversation);
    }
  },

  /**
   * 更新对话标题
   */
  updateTitle(id: string, title: string): void {
    const conversation = this.getConversation(id);
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = Date.now();
      this.saveConversation(conversation);
    }
  },

  /**
   * 添加消息到对话
   */
  addMessage(conversationId: string, message: ChatMessage): void {
    const conversation = this.getConversation(conversationId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.updatedAt = Date.now();

      // 如果是第一条用户消息，更新标题
      if (conversation.messages.length === 1 && message.role === "user") {
        conversation.title = this.generateTitle(message.content);
      }

      this.saveConversation(conversation);
    }
  },

  /**
   * 更新最后一条消息（用于流式响应）
   */
  updateLastMessage(conversationId: string, content: string): void {
    const conversation = this.getConversation(conversationId);
    if (conversation && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage.role === "assistant") {
        lastMessage.content = content;
        conversation.updatedAt = Date.now();
        this.saveConversation(conversation);
      }
    }
  },

  /**
   * 获取当前对话ID
   */
  getCurrentConversationId(): string | null {
    return storage.get<string | null>(STORAGE_KEYS.AI_CURRENT_CONVERSATION, null);
  },

  /**
   * 设置当前对话ID
   */
  setCurrentConversationId(id: string): void {
    storage.set(STORAGE_KEYS.AI_CURRENT_CONVERSATION, id);
  },

  /**
   * 清除当前对话ID
   */
  clearCurrentConversationId(): void {
    storage.remove(STORAGE_KEYS.AI_CURRENT_CONVERSATION);
  },

  /**
   * 生成对话标题（从第一条消息提取）
   */
  generateTitle(firstMessage: string): string {
    if (!firstMessage.trim()) {
      return "新对话";
    }

    // 简单的标题生成：取前30个字符
    let title = firstMessage.trim().substring(0, 30);
    if (firstMessage.length > 30) {
      title += "...";
    }

    // 移除常见的问候语
    const greetings = ["你好", "hi", "hello", "嗨"];
    for (const greeting of greetings) {
      if (title.toLowerCase().startsWith(greeting.toLowerCase())) {
        title = title.substring(greeting.length).trim() || "新对话";
        break;
      }
    }

    return title || "新对话";
  },

  /**
   * 获取排序后的对话列表（置顶优先，然后按更新时间排序）
   */
  getSortedConversations(): ConversationMetadata[] {
    const conversations = this.getAllMetadata();
    return conversations.sort((a, b) => {
      // 置顶的排在前面
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // 然后按更新时间降序
      return b.updatedAt - a.updatedAt;
    });
  },

  /**
   * 导出对话为JSON字符串
   */
  exportConversation(id: string): string {
    const conversation = this.getConversation(id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    return JSON.stringify(conversation, null, 2);
  },

  /**
   * 导入对话
   */
  importConversation(jsonString: string): Conversation {
    const conversation: Conversation = JSON.parse(jsonString);
    
    // 生成新的ID以避免冲突
    conversation.id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    conversation.updatedAt = Date.now();

    this.saveConversation(conversation);
    return conversation;
  },

  /**
   * 清空所有对话
   */
  clearAll(): void {
    storage.remove(STORAGE_KEYS.AI_CONVERSATIONS);
    storage.remove(STORAGE_KEYS.AI_CURRENT_CONVERSATION);
  },

  /**
   * 获取对话统计信息
   */
  getStats(): {
    totalConversations: number;
    totalMessages: number;
    pinnedConversations: number;
  } {
    const conversations = storage.get<Record<string, Conversation>>(
      STORAGE_KEYS.AI_CONVERSATIONS,
      {}
    );
    const allConversations = Object.values(conversations);

    return {
      totalConversations: allConversations.length,
      totalMessages: allConversations.reduce((sum, conv) => sum + conv.messages.length, 0),
      pinnedConversations: allConversations.filter((conv) => conv.isPinned).length,
    };
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
