
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReminders } from '@/contexts/ReminderContext';
import PhoneVerification from './PhoneVerification';
import { Bell, Send } from 'lucide-react';
import { send_sms } from '@/utils/smsService';
import { toast } from '@/components/ui/sonner';

// Common timezones list for browsers that don't support Intl.supportedValuesOf
const commonTimezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const UserSettings: React.FC = () => {
  const { userSettings, toggleNotifications, updateTimezone } = useReminders();
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [timezones, setTimezones] = useState<string[]>(() => {
    // Get all supported timezones
    try {
      // Try to use Intl API if available
      // @ts-ignore - Ignore TypeScript error for browsers that support this but TS doesn't recognize it
      if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
        // @ts-ignore
        return Intl.supportedValuesOf('timeZone');
      }
      return commonTimezones;
    } catch (e) {
      // Fallback for browsers that don't support Intl.supportedValuesOf
      return commonTimezones;
    }
  });
  
  const handleTestSms = async () => {
    if (isSendingTest) return;
    
    // Check if phone is verified
    if (!userSettings.phoneVerification?.isVerified) {
      toast.error("Phone not verified", {
        description: "Please verify your phone number before testing SMS"
      });
      return;
    }
    
    setIsSendingTest(true);
    try {
      // Use the user's actual verified phone number
      const result = await send_sms(
        userSettings.phoneVerification.phoneNumber, 
        "This is a test from Lovable + Supabase"
      );
      
      if (result.success) {
        toast.success("Test SMS sent successfully", {
          description: result.message
        });
      } else {
        toast.error("Failed to send test SMS", {
          description: result.error
        });
      }
    } catch (error) {
      toast.error("Test SMS error", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsSendingTest(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <PhoneVerification />
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium">Notification Settings</h3>
        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <Label htmlFor="notifications" className="text-base">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive SMS reminders at scheduled times
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="notifications"
                checked={userSettings.notificationsEnabled}
                onCheckedChange={toggleNotifications}
              />
              <Bell 
                size={18} 
                className={
                  userSettings.notificationsEnabled 
                    ? "text-reminder-purple" 
                    : "text-muted-foreground"
                } 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={userSettings.timezone}
              onValueChange={updateTimezone}
            >
              <SelectTrigger id="timezone" className="w-full">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All reminder times will be based on this timezone
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestSms}
              disabled={isSendingTest || !userSettings.phoneVerification?.isVerified}
              className="text-xs"
            >
              {isSendingTest ? "Sending..." : "Test SMS"}
              <Send size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium">About this App</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is a reminder app that sends fun, sarcastic text messages at 
          scheduled times using a Supabase edge function with Twilio.
        </p>
      </div>
    </div>
  );
};

export default UserSettings;
