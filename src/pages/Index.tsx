
import { ReminderProvider } from '@/contexts/ReminderContext';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  return (
    <ReminderProvider>
      <div className="min-h-screen gradient-background">
        <Dashboard />
      </div>
    </ReminderProvider>
  );
};

export default Index;
