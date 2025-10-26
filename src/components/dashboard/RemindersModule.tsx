import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, X, Calendar, CreditCard, Gift } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const RemindersModule = () => {
  const { reminders, isLoading, createReminder, dismissReminder, getUpcomingReminders, getUrgency } = useReminders();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    reminder_type: "bill_due",
    title: "",
    description: "",
    reminder_date: "",
    card_id: "",
  });

  const upcomingReminders = getUpcomingReminders(5);

  const handleCreateReminder = () => {
    createReminder({
      reminder_type: reminderForm.reminder_type,
      title: reminderForm.title,
      description: reminderForm.description || undefined,
      reminder_date: reminderForm.reminder_date,
      card_id: reminderForm.card_id || undefined,
    });
    setIsAddModalOpen(false);
    setReminderForm({ reminder_type: "bill_due", title: "", description: "", reminder_date: "", card_id: "" });
  };

  const getUrgencyColor = (urgency: 'high' | 'medium' | 'low'): "default" | "destructive" | "outline" | "secondary" => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bill_due': return Calendar;
      case 'annual_fee': return CreditCard;
      case 'bonus_expiry': return Gift;
      default: return Bell;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-playfair">Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading reminders...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-playfair">Reminders</CardTitle>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reminder_type">Type *</Label>
                <Select 
                  value={reminderForm.reminder_type} 
                  onValueChange={(value) => setReminderForm({ ...reminderForm, reminder_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bill_due">Bill Due Date</SelectItem>
                    <SelectItem value="annual_fee">Annual Fee Due</SelectItem>
                    <SelectItem value="bonus_expiry">Bonus Expiry</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reminder_title">Title *</Label>
                <Input
                  id="reminder_title"
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                  placeholder="e.g., HDFC Bill Payment"
                />
              </div>
              <div>
                <Label htmlFor="reminder_date">Date *</Label>
                <Input
                  id="reminder_date"
                  type="date"
                  value={reminderForm.reminder_date}
                  onChange={(e) => setReminderForm({ ...reminderForm, reminder_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reminder_card">Card ID (optional)</Label>
                <Input
                  id="reminder_card"
                  value={reminderForm.card_id}
                  onChange={(e) => setReminderForm({ ...reminderForm, card_id: e.target.value })}
                  placeholder="e.g., hdfc-regalia"
                />
              </div>
              <div>
                <Label htmlFor="reminder_description">Notes</Label>
                <Input
                  id="reminder_description"
                  value={reminderForm.description}
                  onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <Button 
                onClick={handleCreateReminder} 
                disabled={!reminderForm.title || !reminderForm.reminder_date}
                className="w-full"
              >
                Create Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {upcomingReminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No upcoming reminders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingReminders.map((reminder) => {
              const urgency = getUrgency(reminder.reminder_date);
              const Icon = getTypeIcon(reminder.reminder_type);
              return (
                <div
                  key={reminder.id}
                  className="flex items-start gap-3 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm">{reminder.title}</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissReminder(reminder.id)}
                        className="h-6 w-6 p-0 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getUrgencyColor(urgency)} className="text-xs">
                        {new Date(reminder.reminder_date).toLocaleDateString('en-IN', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Badge>
                      {reminder.card_id && (
                        <span className="text-xs text-muted-foreground truncate">
                          {reminder.card_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
