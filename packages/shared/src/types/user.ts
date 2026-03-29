export interface User {
  id: string;
  email: string;
  displayName: string;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  uiLanguage: string;
  dailyGoalMinutes?: number;
  notificationsEnabled?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export interface Device {
  id: string;
  userId: string;
  deviceName: string;
  deviceInfo: DeviceInfo;
  lastSyncAt: string;
}

export interface DeviceInfo {
  platform: 'web' | 'ios' | 'android' | 'desktop';
  userAgent?: string;
  appVersion?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}
