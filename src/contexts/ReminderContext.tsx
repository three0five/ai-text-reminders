import React, { createContext, useState, useContext, useEffect } from 'react';
import { Reminder, UserSettings, PhoneVerification, FrequencyType } from '../types/reminder';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';

interface ReminderContextType {
  reminders: Reminder[];
  userSettings: UserSettings;
  addReminder: (reminder: Omit<Reminder, 'id' | 'sent' | 'sentAt' | 'transformedMessage'>) => void;
  editReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
  updatePhoneNumber: (phoneNumber: string) => void;
  verifyPhone: (code: string) => boolean;
  sendVerificationCode: () => void;
  unlinkPhone: () => void;
  toggleNotifications: () => void;
  updateTimezone: (timezone: string) => void;
  getHistoricalReminders: () => Reminder[];
  getUpcomingReminders: () => Reminder[];
}

// Helper to transform a reminder message into a fun version
const transformMessage = (message: string): string => {
  const funPrefixes = [
    "Hey superstar! Remember to",
    "Psst... Future you will thank you for remembering to",
    "Knock knock! Who's there? It's your reminder to",
    "BEEP BOOP. HUMAN MUST",
    "Your friendly neighborhood AI says:",
    "Drop everything and",
    "This is your conscience speaking. Please",
    "Breaking news: You need to",
    "Alert! Alert! Time to",
    "*taps microphone* Attention please:",
  ];

  const funSuffixes = [
    ". Don't mess this up!",
    ". You've got this!",
    ". No pressure, but... tick tock!",
    ". Your future self is already thanking you.",
    ". Failure is not an option (just kidding, it totally is).",
    ". This message will self-destruct in 5...4...3... Just kidding!",
    ". Achievement unlocked: Responsible Adult!",
    ". Gold star for you if you do this!",
    ". The universe is counting on you.",
    ". Your pet would be so proud.",
  ];

  const randomPrefix = funPrefixes[Math.floor(Math.random() * funPrefixes.length)];
  const randomSuffix = funSuffixes[Math.floor(Math.random() * funSuffixes.length)];

  // Make sure the first letter of the message is lowercase to fit after the prefix
  const formattedMessage = message.charAt(0).toLowerCase() + message.slice(1);
  
  return `${randomPrefix} ${formattedMessage}${randomSuffix}`;
};

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('reminders');
    if (saved) {
      // Convert string dates back to Date objects
      const parsed = JSON.parse(saved);
      return parsed.map((reminder: any) => ({
        ...reminder,
        scheduledTime: new Date(reminder.scheduledTime),
        sentAt: reminder.sentAt ? new Date(reminder.sentAt) : undefined,
        recurringConfig: reminder.recurringConfig 
          ? {
              ...reminder.recurringConfig,
              endDate: reminder.recurringConfig.endDate ? new Date(reminder.recurringConfig.endDate) : null
            }
          : undefined
      }));
    }
    return [];
  });

  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        phoneVerification: parsed.phoneVerification 
          ? {
              ...parsed.phoneVerification,
              verificationSentAt: parsed.phoneVerification.verificationSentAt 
                ? new Date(parsed.phoneVerification.verificationSentAt)
                : undefined
            }
          : null
      };
    }
    return {
      phoneVerification: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notificationsEnabled: true
    };
  });

  // Save reminders to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Save user settings to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
  }, [userSettings]);

  // NOTE: Browser-side timer/setInterval removed as requested
  // Reminders are now processed server-side by the cron function

  // Add a new reminder
  const addReminder = (reminder: Omit<Reminder, 'id' | 'sent' | 'sentAt' | 'transformedMessage'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: uuidv4(),
      sent: false
    };
    
    setReminders(prev => [...prev, newReminder]);
    toast.success("Reminder Created", {
      description: "Your reminder has been scheduled",
    });
  };

  // Edit an existing reminder
  const editReminder = (reminder: Reminder) => {
    setReminders(prev => prev.map(r => r.id === reminder.id ? reminder : r));
    toast.success("Reminder Updated", {
      description: "Your reminder has been updated",
    });
  };

  // Delete a reminder
  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success("Reminder Deleted", {
      description: "Your reminder has been removed",
    });
  };

  // Update phone number
  const updatePhoneNumber = (phoneNumber: string) => {
    const phoneVerification: PhoneVerification = {
      phoneNumber,
      isVerified: false,
      verificationCode: Math.floor(100000 + Math.random() * 900000).toString(), // 6-digit code
      verificationSentAt: new Date()
    };
    
    setUserSettings(prev => ({
      ...prev,
      phoneVerification
    }));
    
    // In a real app, this would send the actual SMS
    // sendSMS(phoneNumber, `Your verification code is: ${phoneVerification.verificationCode}`);
    
    toast.info("Verification Code Sent", {
      description: `Check your phone for a 6-digit code. For this demo, the code is: ${phoneVerification.verificationCode}`,
    });
  };

  // Send verification code
  const sendVerificationCode = () => {
    if (!userSettings.phoneVerification) {
      toast.error("No Phone Number", {
        description: "Please enter your phone number first",
      });
      return;
    }
    
    // Generate a new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    setUserSettings(prev => ({
      ...prev,
      phoneVerification: prev.phoneVerification ? {
        ...prev.phoneVerification,
        verificationCode,
        verificationSentAt: new Date()
      } : null
    }));
    
    // In a real app, this would send the actual SMS
    // if (userSettings.phoneVerification) {
    //   sendSMS(
    //     userSettings.phoneVerification.phoneNumber,
    //     `Your verification code is: ${verificationCode}`
    //   );
      
      toast.info("Verification Code Sent", {
        description: `Check your phone for a 6-digit code. For this demo, the code is: ${verificationCode}`,
      });
    // }
  };

  // Verify phone
  const verifyPhone = (code: string): boolean => {
    if (!userSettings.phoneVerification || userSettings.phoneVerification.verificationCode !== code) {
      toast.error("Invalid Code", {
        description: "The verification code you entered is incorrect",
      });
      return false;
    }
    
    setUserSettings(prev => ({
      ...prev,
      phoneVerification: prev.phoneVerification ? {
        ...prev.phoneVerification,
        isVerified: true,
        verificationCode: undefined
      } : null
    }));
    
    toast.success("Phone Verified", {
      description: "Your phone number has been verified",
    });
    
    return true;
  };

  // Unlink phone
  const unlinkPhone = () => {
    setUserSettings(prev => ({
      ...prev,
      phoneVerification: null
    }));
    
    toast.success("Phone Unlinked", {
      description: "Your phone number has been removed",
    });
  };

  // Toggle notifications
  const toggleNotifications = () => {
    setUserSettings(prev => ({
      ...prev,
      notificationsEnabled: !prev.notificationsEnabled
    }));
    
    toast.success(
      userSettings.notificationsEnabled ? "Notifications Disabled" : "Notifications Enabled",
      {
        description: userSettings.notificationsEnabled 
          ? "You will no longer receive reminder notifications" 
          : "You will now receive reminder notifications",
      }
    );
  };

  // Update timezone
  const updateTimezone = (timezone: string) => {
    setUserSettings(prev => ({
      ...prev,
      timezone
    }));
    
    toast.success("Timezone Updated", {
      description: `Your timezone has been set to ${timezone}`,
    });
  };

  // Get historical reminders (sent)
  const getHistoricalReminders = (): Reminder[] => {
    return reminders.filter(reminder => reminder.sent);
  };

  // Get upcoming reminders (not sent)
  const getUpcomingReminders = (): Reminder[] => {
    return reminders.filter(reminder => !reminder.sent);
  };

  const value = {
    reminders,
    userSettings,
    addReminder,
    editReminder,
    deleteReminder,
    updatePhoneNumber,
    verifyPhone,
    sendVerificationCode,
    unlinkPhone,
    toggleNotifications,
    updateTimezone,
    getHistoricalReminders,
    getUpcomingReminders
  };

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
};

export const useReminders = (): ReminderContextType => {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
};
