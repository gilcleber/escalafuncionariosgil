
import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shift } from '@/types/employee';
import { validateWorkRules } from '@/utils/workRules';

interface CalendarCompactViewProps {
  scheduleData: any;
  onCellClick: (employeeId: string, date: string) => void;
  getShiftForEmployeeAndDate: (employeeId: string, date: string) => Shift | undefined;
  getShiftDisplay: (shift: Shift | undefined, date: string) => string;
  getShiftColor: (shift: Shift | undefined, date: string) => string;
  formatDate: (day: number) => string;
  getDaysInMonth: (month: number, year: number) => number;
  generateCalendarDays: () => (number | null)[];
  isEmployeeOrViewOnly: boolean;
  isSaving: boolean;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const CalendarCompactView: React.FC<CalendarCompactViewProps> = ({
  scheduleData,
  onCellClick,
  getShiftForEmployeeAndDate,
  getShiftDisplay,
  getShiftColor,
  formatDate,
  getDaysInMonth,
  generateCalendarDays,
  isEmployeeOrViewOnly,
  isSaving
}) => {
  const calendarDays = generateCalendarDays();
  const daysInMonth = getDaysInMonth(scheduleData.month, scheduleData.year);
  
  const hasValidationErrors = (employeeId: string) => {
    const violations = validateWorkRules(
      scheduleData.shifts, 
      employeeId, 
      scheduleData.month, 
      scheduleData.year, 
      scheduleData.settings.workRules
    );
    return violations.length > 0;
  };

  // Function to get all manager-defined shifts for an employee on a specific date
  const getManagerDefinedShifts = (employeeId: string, date: string): Shift[] => {
    const allShifts = scheduleData.shifts.filter(s => s.employeeId === employeeId && s.date === date);
    
    // Return only shifts that are either:
    // 1. Non-work shifts (dayoff, vacation, etc.)
    // 2. Work shifts with specific start and end times (manager-defined)
    return allShifts.filter(shift => {
      if (shift.type !== 'work') {
        return true; // Include all non-work shifts
      }
      // For work shifts, only include those with specific times
      return shift.startTime && shift.endTime && shift.startTime.trim() !== '' && shift.endTime.trim() !== '';
    });
  };

  // Function to get events for a specific date
  const getEventsForDate = (date: string) => {
    return scheduleData.settings.events.filter(e => e.date === date);
  };

  // Function to display multiple shifts and events in compact format
  const getMultipleShiftsAndEventsDisplay = (shifts: Shift[], events: any[]): React.ReactNode => {
    const hasShifts = shifts.length > 0;
    const hasEvents = events.length > 0;
    
    if (!hasShifts && !hasEvents) return '';
    
    return (
      <div className="flex flex-col gap-0.5">
        {/* Display shifts first */}
        {shifts.map((shift, index) => (
          <div key={`shift-${index}`} className="text-xs leading-tight text-center font-semibold text-neuro-text-primary">
            {shift.type === 'work' && shift.startTime && shift.endTime 
              ? `${shift.startTime}-${shift.endTime}`
              : shift.type === 'dayoff' ? 'FOLGA' :
                shift.type === 'vacation' ? 'FÉRIAS' :
                shift.type === 'medical' ? 'ATESTADO' :
                shift.type === 'holiday' ? 'FERIADO' :
                shift.type === 'breastfeeding' ? 'AMAMENT.' :
                shift.type === 'external' ? 'EXTERNO' :
                shift.type === 'suspension' ? 'SUSPENSÃO' :
                shift.type === 'paternity' ? 'PATERNID.' :
                shift.type === 'blood_donation' ? 'DOAÇÃO' :
                shift.type === 'military' ? 'MILITAR' :
                shift.type === 'marriage' ? 'CASAMENTO' :
                shift.type === 'public_service' ? 'SERV.PÚB.' :
                shift.type === 'family_death' ? 'ÓBITO' :
                shift.type === 'deduct_day' ? 'DESCONTO' :
                ''
            }
          </div>
        ))}
        {/* Display events */}
        {events.map((event, index) => (
          <div key={`event-${index}`} className="text-xs leading-tight text-center font-bold text-black bg-neuro-warning/20 rounded px-1">
            {event.time ? `${event.name} ${event.time}` : event.name}
          </div>
        ))}
      </div>
    );
  };

  // Function to get color for multiple shifts (uses first shift color, or warning for events)
  const getMultipleShiftsColor = (shifts: Shift[], events: any[], date: string): string => {
    if (shifts.length > 0) {
      return getShiftColor(shifts[0], date);
    }
    if (events.length > 0) {
      return 'bg-neuro-warning/10'; // Light warning color for events
    }
    return '';
  };

  return (
    <div className="neuro-card p-4">
      <div className="overflow-x-auto">
        <div className="space-y-3">
          {/* Header with day numbers - removed FUNC. column */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className={cn(
                "neuro-outset-sm p-2 text-sm font-bold text-center rounded-xl",
                index === 0 
                  ? "bg-neuro-error/10 text-neuro-calendar-weekend" 
                  : "bg-neuro-accent/10 text-neuro-calendar-weekday"
              )}>
                {WEEKDAYS[index]}
              </div>
            ))}
          </div>

          {/* Calendar grid with improved spacing and detailed shift information */}
          {scheduleData.employees.map((employee: any) => (
            <div key={employee.id} className="space-y-1">
              <div className={cn(
                "neuro-outset-sm p-3 bg-gradient-to-r from-neuro-accent/20 to-neuro-accent-light/20 text-sm font-bold text-center rounded-xl flex items-center justify-center border-2",
                hasValidationErrors(employee.id) 
                  ? "border-neuro-error bg-neuro-error/10" 
                  : "border-neuro-accent/30"
              )}>
                <div className="flex items-center gap-2">
                  {hasValidationErrors(employee.id) && <AlertTriangle className="h-3 w-3 text-neuro-error" />}
                  <span className="truncate font-bold text-neuro-accent text-base">
                    {employee.name}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const date = formatDate(day);
                  const shifts = getManagerDefinedShifts(employee.id, date);
                  const events = getEventsForDate(date);
                  const detailedDisplay = getMultipleShiftsAndEventsDisplay(shifts, events);
                  
                  return (
                    <div
                      key={`${employee.id}-${day}`}
                      className={cn(
                        "neuro-inset p-1 min-h-[55px] text-sm transition-all duration-200 rounded-xl flex flex-col items-center justify-center bg-neuro-element",
                        getMultipleShiftsColor(shifts, events, date),
                        !isEmployeeOrViewOnly && !isSaving && "neuro-hover cursor-pointer"
                      )}
                      onClick={() => !isSaving && onCellClick(employee.id, date)}
                      title={`${day}: ${shifts.map(s => s.type === 'work' && s.startTime && s.endTime ? `${s.startTime}-${s.endTime}` : s.type).join(', ')}${events.length > 0 ? (shifts.length > 0 ? ', ' : '') + events.map(e => e.time ? `${e.name} ${e.time}` : e.name).join(', ') : ''}`}
                    >
                      <div className="text-center text-xs leading-tight w-full">
                        <div className="font-bold mb-1 text-neuro-text-primary">{day}</div>
                        <div className="text-xs">
                          {detailedDisplay}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarCompactView;
