
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { format, addDays, set, setHours, setMinutes } from 'date-fns';
import { useReminders } from '@/contexts/ReminderContext';
import { FrequencyType, Reminder, RecurringConfig } from '@/types/reminder';
import { toast } from '@/components/ui/sonner';
import { Check, Clock } from 'lucide-react';

interface ReminderFormProps {
  onComplete?: () => void;
  existingReminder?: Reminder;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ 
  onComplete,
  existingReminder 
}) => {
  const { addReminder, editReminder, userSettings } = useReminders();
  const isEditing = !!existingReminder;
  
  // Form state
  const [message, setMessage] = useState(existingReminder?.message || '');
  const [date, setDate] = useState<Date | undefined>(
    existingReminder ? new Date(existingReminder.scheduledTime) : new Date()
  );
  const [time, setTime] = useState(
    existingReminder 
      ? format(new Date(existingReminder.scheduledTime), 'HH:mm')
      : format(new Date(), 'HH:mm')
  );
  const [recurring, setRecurring] = useState(existingReminder?.recurring || false);
  const [frequency, setFrequency] = useState<FrequencyType>(
    existingReminder?.recurringConfig?.frequency || 'once'
  );
  const [times, setTimes] = useState<number>(
    existingReminder?.recurringConfig?.times || 1
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    existingReminder?.recurringConfig?.daysOfWeek || []
  );
  const [endDate, setEndDate] = useState<Date | null | undefined>(
    existingReminder?.recurringConfig?.endDate || null
  );
  
  // Days of week mapping for UI
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Toggle day selection for weekly recurring
  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    
    if (recurring && frequency === 'weekly' && daysOfWeek.length === 0) {
      toast.error("Please select at least one day of the week");
      return;
    }
    
    // Check if phone is verified
    if (!userSettings.phoneVerification?.isVerified) {
      toast.error("Please verify your phone number in the settings tab");
      return;
    }
    
    // Parse time into hours and minutes
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create a new date object with the selected date and time
    const scheduledTime = new Date(date);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // Check if the scheduled time is in the past
    if (scheduledTime < new Date() && !recurring) {
      toast.error("Cannot schedule reminders in the past");
      return;
    }
    
    // Create recurring config if needed
    let recurringConfig: RecurringConfig | undefined = undefined;
    if (recurring) {
      recurringConfig = {
        frequency,
        times: frequency === 'custom' ? times : undefined,
        daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
        endDate: endDate
      };
    }
    
    // Create the reminder object
    const reminderData: Omit<Reminder, 'id' | 'sent' | 'sentAt' | 'transformedMessage'> = {
      message,
      scheduledTime,
      recurring,
      recurringConfig
    };
    
    if (isEditing && existingReminder) {
      editReminder({
        ...existingReminder,
        ...reminderData
      });
    } else {
      addReminder(reminderData);
    }
    
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="message">What do you want to be reminded about?</Label>
        <Textarea
          id="message"
          placeholder="Enter your reminder message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px]"
          required
        />
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="space-y-2 flex-1">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2 flex-1">
          <Label htmlFor="time">Time</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1"
              required
            />
            <Clock className="text-muted-foreground" size={20} />
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="recurring"
          checked={recurring}
          onCheckedChange={setRecurring}
        />
        <Label htmlFor="recurring">Recurring Reminder</Label>
      </div>
      
      {recurring && (
        <div className="space-y-4 border rounded-md p-4 bg-secondary/50">
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value) => setFrequency(value as FrequencyType)}
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex flex-wrap gap-2">
                {daysMap.map((day, index) => (
                  <Button
                    key={day}
                    type="button"
                    size="sm"
                    variant={daysOfWeek.includes(index) ? "default" : "outline"}
                    onClick={() => toggleDay(index)}
                    className="min-w-[3rem]"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {frequency === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="times">Times per day</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="times"
                  type="number"
                  min="1"
                  max="24"
                  value={times}
                  onChange={(e) => setTimes(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span>times per day</span>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>End Date (Optional)</Label>
              {endDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEndDate(null)}
                >
                  Clear
                </Button>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {endDate ? format(endDate, 'PPP') : <span>No end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate || undefined}
                  onSelect={setEndDate}
                  initialFocus
                  fromDate={addDays(new Date(), 1)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
      
      <Button type="submit" className="w-full">
        {isEditing ? 'Update Reminder' : 'Create Reminder'}
      </Button>
    </form>
  );
};

export default ReminderForm;
