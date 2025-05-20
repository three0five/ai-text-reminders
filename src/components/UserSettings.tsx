
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
import { Bell } from 'lucide-react';

const UserSettings: React.FC = () => {
  const { userSettings, toggleNotifications, updateTimezone } = useReminders();
  const [timezones, setTimezones] = useState<string[]>(() => {
    // Get all supported timezones from Intl API
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch (e) {
      // Fallback for browsers that don't support Intl.supportedValuesOf
      return [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Anchorage',
        'Pacific/Honolulu',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Australia/Sydney',
      ];
    }
  });
  
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
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium">About this App</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is a simple reminder app that sends fun, sarcastic text messages at 
          scheduled times. For demo purposes, the SMS sending is simulated.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          To implement actual SMS sending, you would need to integrate with a service like
          Twilio, Nexmo, or AWS SNS.
        </p>
      </div>
    </div>
  );
};

export default UserSettings;
