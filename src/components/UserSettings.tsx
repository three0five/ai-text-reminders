import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { sendCode, confirmCode } from '@/services/phoneService';
import { supabase } from '@/supabaseClient';

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

interface VerifiedPhone {
  id: string;
  e164_number: string;
}

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
  
  // Phone verification states
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedPhones, setVerifiedPhones] = useState<VerifiedPhone[]>([]);
  const [isLoadingPhones, setIsLoadingPhones] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Load verified phones on mount
  useEffect(() => {
    const loadVerifiedPhones = async () => {
      setIsLoadingPhones(true);
      try {
        const { data, error } = await supabase
          .from('phone_numbers')
          .select('id, e164_number')
          .eq('verified', true);
        
        if (error) throw error;
        setVerifiedPhones(data || []);
      } catch (error) {
        console.error('Error loading verified phones:', error);
        toast.error('Failed to load verified phone numbers');
      } finally {
        setIsLoadingPhones(false);
      }
    };

    loadVerifiedPhones();
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only digits and + character
    const cleaned = e.target.value.replace(/[^\d+]/g, '');
    setPhone(cleaned);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.startsWith('+')) {
      toast.error('Phone number must start with + and country code');
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await sendCode(phone);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send verification code');
      }
      
      toast.success('Verification code sent', {
        description: 'Check your phone for the 6-digit code'
      });
      setIsVerifying(true);
    } catch (error) {
      console.error('Error sending code:', error);
      toast.error('Failed to send verification code', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsConfirming(true);
    try {
      const response = await confirmCode(phone, verificationCode);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid or expired verification code');
      }

      // Reload verified phones
      const { data } = await supabase
        .from('phone_numbers')
        .select('id, e164_number')
        .eq('e164_number', phone)
        .single();
      
      if (data) {
        setVerifiedPhones(prev => [...prev, data]);
      }
      
      toast.success('Phone number verified successfully');
      setIsVerifying(false);
      setPhone('');
      setVerificationCode('');
    } catch (error) {
      console.error('Error confirming code:', error);
      toast.error('Verification failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsConfirming(false);
    }
  };
  
  const handleTestSms = async () => {
    if (isSendingTest || verifiedPhones.length === 0) return;
    
    setIsSendingTest(true);
    try {
      // Use the first verified phone number for test
      const result = await send_sms(
        verifiedPhones[0].e164_number, 
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

  const formatPhoneNumber = (e164Number: string) => {
    // Basic formatter for E.164 format
    if (e164Number.length < 8) return e164Number;
    
    // For US/CA numbers
    if (e164Number.startsWith('+1') && e164Number.length === 12) {
      return `+1 (${e164Number.substring(2, 5)}) ${e164Number.substring(5, 8)}-${e164Number.substring(8)}`;
    }
    
    // Generic formatting for other countries
    const countryCode = e164Number.substring(0, e164Number.length - 10);
    const number = e164Number.substring(e164Number.length - 10);
    return `${countryCode} ${number.substring(0, 3)}-${number.substring(3, 6)}-${number.substring(6)}`;
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Verified Phone Numbers</h3>
        <p className="text-muted-foreground">
          Add and verify phone numbers to receive SMS reminders
        </p>
        
        {isLoadingPhones ? (
          <div className="py-4 text-center text-muted-foreground">Loading verified phones...</div>
        ) : verifiedPhones.length === 0 ? (
          <div className="py-4 border rounded-md mt-4 text-center text-muted-foreground">
            No verified phone numbers. Add one below.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {verifiedPhones.map(phone => (
              <div 
                key={phone.id} 
                className="flex justify-between items-center p-3 border rounded-md"
              >
                <span>{formatPhoneNumber(phone.e164_number)}</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Verified
                </span>
              </div>
            ))}
          </div>
        )}

        {!isVerifying ? (
          <form onSubmit={handleSendCode} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Add Phone Number (E.164 format)</Label>
              <div className="flex space-x-2">
                <Input
                  id="phone"
                  placeholder="+15551234567"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isSendingCode || phone.length < 8}
                >
                  {isSendingCode ? "Sending..." : "Send Code"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must include country code, e.g., +1 for US/Canada
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmCode} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Enter the 6-digit code sent to {phone}</Label>
              <div className="flex justify-center my-4">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isConfirming || verificationCode.length !== 6}
                >
                  {isConfirming ? "Verifying..." : "Verify Code"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsVerifying(false);
                    setVerificationCode('');
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
      
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
              disabled={isSendingTest || verifiedPhones.length === 0}
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
