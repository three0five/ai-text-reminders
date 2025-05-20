
import React, { useState } from 'react';
import { useReminders } from '@/contexts/ReminderContext';
import { Reminder } from '@/types/reminder';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import ReminderForm from './ReminderForm';
import { Check, Edit, Repeat, Trash2, Clock } from 'lucide-react';

interface ReminderListProps {
  type: 'upcoming' | 'history';
}

const ReminderList: React.FC<ReminderListProps> = ({ type }) => {
  const { getUpcomingReminders, getHistoricalReminders, deleteReminder } = useReminders();
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Get the appropriate reminders based on the type
  const reminders = type === 'upcoming' ? getUpcomingReminders() : getHistoricalReminders();
  
  // Sort reminders by date
  const sortedReminders = [...reminders].sort((a, b) => {
    return type === 'upcoming'
      ? new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
      : new Date(b.sentAt || b.scheduledTime).getTime() - new Date(a.sentAt || a.scheduledTime).getTime();
  });
  
  // Handle editing a reminder
  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsEditDialogOpen(true);
  };
  
  // Format recurring info
  const formatRecurringInfo = (reminder: Reminder): string => {
    if (!reminder.recurring || !reminder.recurringConfig) {
      return 'One-time';
    }
    
    const { frequency, times, daysOfWeek, endDate } = reminder.recurringConfig;
    
    switch (frequency) {
      case 'daily':
        return `Daily${endDate ? ` until ${format(new Date(endDate), 'MMM d, yyyy')}` : ''}`;
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const selectedDays = daysOfWeek.map(day => days[day]).join(', ');
          return `Weekly on ${selectedDays}${endDate ? ` until ${format(new Date(endDate), 'MMM d, yyyy')}` : ''}`;
        }
        return `Weekly${endDate ? ` until ${format(new Date(endDate), 'MMM d, yyyy')}` : ''}`;
      case 'monthly':
        return `Monthly${endDate ? ` until ${format(new Date(endDate), 'MMM d, yyyy')}` : ''}`;
      case 'custom':
        if (times && times > 1) {
          return `${times} times daily${endDate ? ` until ${format(new Date(endDate), 'MMM d, yyyy')}` : ''}`;
        }
        return `Custom${endDate ? ` until ${format(new Date(endDate), 'MMM d, yyyy')}` : ''}`;
      default:
        return 'Custom recurring';
    }
  };
  
  // Empty state
  if (sortedReminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-48 p-6 rounded-lg border-2 border-dashed">
        <h3 className="text-lg font-medium">
          {type === 'upcoming' 
            ? 'No upcoming reminders' 
            : 'No reminder history'
          }
        </h3>
        <p className="text-muted-foreground mt-2">
          {type === 'upcoming' 
            ? 'Create a new reminder to get started' 
            : 'Your sent reminders will appear here'
          }
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {sortedReminders.map((reminder) => (
        <Card key={reminder.id} className={
          reminder.recurring ? 'border-l-4 border-l-reminder-purple' : ''
        }>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{reminder.message}</CardTitle>
              {type === 'upcoming' && (
                <div className="flex space-x-1">
                  <Dialog 
                    open={isEditDialogOpen && editingReminder?.id === reminder.id} 
                    onOpenChange={(open) => {
                      if (!open) setEditingReminder(null);
                      setIsEditDialogOpen(open);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(reminder)}
                      >
                        <Edit size={16} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Edit Reminder</DialogTitle>
                      </DialogHeader>
                      {editingReminder && (
                        <ReminderForm
                          existingReminder={editingReminder}
                          onComplete={() => setIsEditDialogOpen(false)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this reminder? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteReminder(reminder.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            <CardDescription>
              {type === 'upcoming' ? (
                <>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>
                      {format(new Date(reminder.scheduledTime), 'MMM d, yyyy')} at{' '}
                      {format(new Date(reminder.scheduledTime), 'h:mm a')}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-1">
                    <Check size={14} className="text-green-500" />
                    <span>
                      Sent on{' '}
                      {format(new Date(reminder.sentAt || reminder.scheduledTime), 'MMM d, yyyy')} at{' '}
                      {format(new Date(reminder.sentAt || reminder.scheduledTime), 'h:mm a')}
                    </span>
                  </div>
                </>
              )}
              {reminder.recurring && (
                <div className="flex items-center space-x-1 mt-1">
                  <Repeat size={14} />
                  <span>{formatRecurringInfo(reminder)}</span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          {type === 'history' && reminder.transformedMessage && (
            <CardContent className="pt-0">
              <div className="mt-2 p-3 bg-reminder-light-purple rounded-md text-sm">
                <p className="font-medium italic">{reminder.transformedMessage}</p>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
      
      <Dialog 
        open={isEditDialogOpen && editingReminder !== null} 
        onOpenChange={(open) => {
          if (!open) setEditingReminder(null);
          setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
          </DialogHeader>
          {editingReminder && (
            <ReminderForm
              existingReminder={editingReminder}
              onComplete={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReminderList;
