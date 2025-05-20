
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReminders } from '@/contexts/ReminderContext';
import { PhoneVerification as PhoneVerificationType } from '@/types/reminder';
import { toast } from '@/components/ui/sonner';
import { Check, X, Phone } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';

const PhoneVerification: React.FC = () => {
  const { userSettings, updatePhoneNumber, verifyPhone, sendVerificationCode, unlinkPhone } = useReminders();
  const [phoneNumber, setPhoneNumber] = useState(userSettings.phoneVerification?.phoneNumber || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Strip all non-numeric characters
    const numbers = value.replace(/[^\d]/g, '');
    
    // Format the number depending on length
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedNumber);
  };
  
  const handleSubmitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extract just the digits for validation
    const digits = phoneNumber.replace(/[^\d]/g, '');
    
    if (digits.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    
    // Format for storage and sending
    const formattedNumber = `+1${digits}`;
    updatePhoneNumber(formattedNumber);
    setIsVerifying(true);
  };
  
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    
    const success = verifyPhone(verificationCode);
    
    if (success) {
      setIsVerifying(false);
      setVerificationCode('');
    }
  };
  
  const handleResendCode = () => {
    sendVerificationCode();
    toast.info("New verification code sent");
  };
  
  const handleUnlinkPhone = () => {
    unlinkPhone();
    setPhoneNumber('');
    setVerificationCode('');
    setIsVerifying(false);
  };
  
  // Render verification status
  const renderVerificationStatus = () => {
    const verification = userSettings.phoneVerification;
    
    if (!verification) {
      return (
        <div className="text-muted-foreground text-sm flex items-center gap-2">
          <X size={16} className="text-destructive" />
          No phone number linked
        </div>
      );
    }
    
    if (verification.isVerified) {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="text-sm flex items-center gap-2">
            <Check size={16} className="text-green-500" />
            <span className="font-medium">Verified:</span> {verification.phoneNumber}
          </div>
          <Button variant="outline" size="sm" onClick={handleUnlinkPhone}>
            Unlink Phone
          </Button>
        </div>
      );
    }
    
    return (
      <div className="text-amber-500 text-sm flex items-center gap-2">
        <Phone size={16} />
        Verification pending
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Phone Verification</h3>
        <p className="text-muted-foreground">
          Link your phone number to receive reminder messages
        </p>
      </div>
      
      {renderVerificationStatus()}
      
      {!userSettings.phoneVerification?.isVerified && (
        <>
          {!isVerifying ? (
            <form onSubmit={handleSubmitPhone} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex space-x-2">
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="flex-1"
                  />
                  <Button type="submit">Verify</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a verification code to this number
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Enter the 6-digit code</Label>
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    Verify Code
                  </Button>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleResendCode}
                      className="flex-1"
                    >
                      Resend Code
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsVerifying(false)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default PhoneVerification;
