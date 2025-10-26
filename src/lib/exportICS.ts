interface UserReminder {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  reminder_type: string;
}

export const generateICSFile = (reminder: UserReminder) => {
  const now = new Date();
  const reminderDate = new Date(reminder.reminder_date);
  
  // Format date for ICS: YYYYMMDDTHHMMSS
  const formatICSDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}T090000`;
  };
  
  const dtstart = formatICSDate(reminderDate);
  const dtstamp = formatICSDate(now);
  
  // Alarm: 1 day before
  const alarmDate = new Date(reminderDate);
  alarmDate.setDate(alarmDate.getDate() - 1);
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Card & Carry//Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${reminder.id}@card-carry.app`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `SUMMARY:${reminder.title}`,
    `DESCRIPTION:${reminder.description || 'Card reminder from Card & Carry'}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'DESCRIPTION:Reminder',
    'ACTION:DISPLAY',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  
  // Create blob and download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `card-carry-reminder-${reminder.reminder_type}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
