
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import ReminderForm from './ReminderForm';
import ReminderList from './ReminderList';
import UserSettings from './UserSettings';
import { useReminders } from '@/contexts/ReminderContext';

const Dashboard: React.FC = () => {
  const [isNewReminderDialogOpen, setIsNewReminderDialogOpen] = useState(false);
  const { getUpcomingReminders, getHistoricalReminders } = useReminders();
  
  const upcomingCount = getUpcomingReminders().length;
  const historyCount = getHistoricalReminders().length;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-reminder-purple to-reminder-dark-purple bg-clip-text text-transparent">
          Fun Text Reminders
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Schedule lighthearted reminder messages to yourself. Get important reminders with a touch of humor!
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="upcoming" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="upcoming" className="relative">
                Upcoming
                {upcomingCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-reminder-purple text-white text-xs flex items-center justify-center">
                    {upcomingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="relative">
                History
                {historyCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-muted-foreground text-white text-xs flex items-center justify-center">
                    {historyCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <Dialog open={isNewReminderDialogOpen} onOpenChange={setIsNewReminderDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1">
                  <Plus size={16} /> New Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>New Reminder</DialogTitle>
                </DialogHeader>
                <ReminderForm onComplete={() => setIsNewReminderDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          
          <TabsContent value="upcoming" className="mt-0">
            <Card className="border-t-4 border-t-reminder-purple">
              <CardHeader className="pb-3">
                <CardTitle>Upcoming Reminders</CardTitle>
                <CardDescription>
                  View and manage your scheduled reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReminderList type="upcoming" />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            <Card className="border-t-4 border-t-reminder-soft-blue">
              <CardHeader className="pb-3">
                <CardTitle>Reminder History</CardTitle>
                <CardDescription>
                  View your past reminders and the fun messages that were sent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReminderList type="history" />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0">
            <Card className="border-t-4 border-t-muted-foreground">
              <CardHeader className="pb-3">
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Manage your phone number and notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
