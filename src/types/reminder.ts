
export type FrequencyType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export type RecurringConfig = {
  frequency: FrequencyType;
  times?: number; // For custom frequency (x times a day)
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  daysOfMonth?: number[]; // 1-31
  endDate?: Date | null;
};

export interface Reminder {
  id: string;
  message: string;
  scheduledTime: Date;
  recurring: boolean;
  recurringConfig?: RecurringConfig;
  sent: boolean;
  sentAt?: Date;
  transformedMessage?: string; // The fun version that was actually sent
}

export interface PhoneVerification {
  phoneNumber: string;
  isVerified: boolean;
  verificationCode?: string;
  verificationSentAt?: Date;
}

export interface UserSettings {
  phoneVerification: PhoneVerification | null;
  timezone: string;
  notificationsEnabled: boolean;
}
