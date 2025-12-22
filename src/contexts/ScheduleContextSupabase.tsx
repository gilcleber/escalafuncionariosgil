import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee, Shift, ScheduleData, ScheduleSettings, Event, Holiday, WorkScale, WorkRule, EmployeeWorkRule, EmployeeRoutine } from '@/types/employee';
import { getBrazilianHolidays } from '@/utils/holidays';
import { useEmployees } from '@/hooks/useEmployees';
import { useShifts } from '@/hooks/useShifts';
import { useSettings } from '@/hooks/useSettings';
import { createDefaultScheduleData } from '@/services/scheduleService';

interface ScheduleContextType {
  scheduleData: ScheduleData;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (id: string, shift: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  setCurrentMonth: (month: number, year: number) => void;
  updateSettings: (settings: Partial<ScheduleSettings>) => void;
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  addEmployeeRoutine: (routine: Omit<EmployeeRoutine, 'id'>) => void;
  updateEmployeeRoutine: (id: string, routine: Partial<EmployeeRoutine>) => void;
  deleteEmployeeRoutine: (id: string) => void;
  addCustomHoliday: (holiday: Holiday) => void;
  removeCustomHoliday: (date: string) => void;
  createShiftWithAutoEndTime: (employeeId: string, date: string, startTime: string, type: Shift['type'], description?: string) => void;
  saveScheduleData: () => void; // Deprecated/No-op
  isLoading: boolean;
  isSaving: boolean;
  updateEmployeeWorkRule: (employeeId: string, workScale: WorkScale, customRules?: Partial<WorkRule>) => void;
  getEmployeeWorkRule: (employeeId: string) => EmployeeWorkRule | undefined;
  archiveEmployee: (id: string, date: string) => void;
  restoreEmployee: (id: string) => void;
  reorderEmployees: (items: { id: string; displayOrder: number }[]) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  // Auth State
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        console.log("No session found in Context. Attempting Anonymous Sign-in...");
        supabase.auth.signInAnonymously().then(({ data, error }) => {
          if (error) console.error("Auto-Auth Error:", error);
          else setSession(data.session);
        });
      }
    });

    // 2. Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- New Independent Hooks ---
  // We pass 'session?.user?.id' as a dependency to the hooks if we modified them, 
  // but since we didn't Mod them to take arguments, we rely on them checking supabase.auth.getUser().
  // PROBLEM: Their useEffect([]) runs once. They need to re-run when session changes.
  // We need to modify the hooks to export a 'refetch' and call it, OR modify them to depend on an event.
  // The cleanest way (Frankenstein fix) is to pass 'session' to them if we could.
  // Since we can't easily change signatures without breaking other calls (though only used here), 
  // Let's modify the hooks to listen to Auth State too? 
  // No, that's redundant.
  // Let's passed 'session' ID to the hooks? 
  // Yes, I will update the hooks to accept 'userId'? 
  // No, I'll update the hooks to listen to onAuthStateChange.

  // Actually, I can just force a re-render of this Provider when session changes?
  // Use 'key={session?.user?.id}' on ... wait, hooks are above.

  // Okay, plan: Modify hooks to `useEffect(() => { fetch() }, [authChanged])`?
  // Let's modify hooks to accept `session` or listen to `supabase` auth.

  // Let's ASSUME I update the hooks next. For now, let's implement the Auth logic here.

  const { employees, loadingEmployees, addEmployee, updateEmployee, deleteEmployee, archiveEmployee, restoreEmployee, reorderEmployees, refetchEmployees } = useEmployees();
  const { shifts, loadingShifts, addShift, updateShift, deleteShift, createShiftWithAutoEndTime, refetchShifts } = useShifts();
  const { settings, loadingSettings, updateSettings, addEvent, updateEvent, deleteEvent, addCustomHoliday, removeCustomHoliday, addEmployeeRoutine, updateEmployeeRoutine, deleteEmployeeRoutine, updateEmployeeWorkRule, getEmployeeWorkRule, refetchSettings } = useSettings();

  // Trigger Refetch when Session becomes available
  useEffect(() => {
    if (session?.user) {
      console.log("Session active. Refetching all data...", session.user.id);
      refetchEmployees?.();
      refetchShifts?.();
      refetchSettings?.();
    }
  }, [session]);

  // Local State for Month/Year (UI Only)
  const [currentDate, setCurrentDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

  // Construct the monolithic 'scheduleData' object for backward compatibility
  const scheduleData: ScheduleData = {
    ...createDefaultScheduleData(),
    employees: employees || [],
    shifts: shifts || [],
    settings: settings || createDefaultScheduleData().settings,
    month: currentDate.month,
    year: currentDate.year
  };

  const isLoading = (loadingEmployees || loadingShifts || loadingSettings) && !session;

  // Sync Holidays (National)
  useEffect(() => {
    if (isLoading) return;
    const nationalHolidays = getBrazilianHolidays(currentDate.year);
    const customHolidays = settings.holidays || [];
    scheduleData.settings.holidays = [...nationalHolidays, ...customHolidays];
  }, [currentDate.year, isLoading, settings.holidays]);

  return (
    <ScheduleContext.Provider value={{
      scheduleData,
      isLoading,
      isSaving: false,
      saveScheduleData: () => console.log("Auto-save is active per entity."),

      addEmployee, updateEmployee, deleteEmployee,
      archiveEmployee, restoreEmployee, reorderEmployees,

      addShift, updateShift, deleteShift, createShiftWithAutoEndTime,

      setCurrentMonth: (m, y) => setCurrentDate({ month: m, year: y }),

      updateSettings,
      addEvent, updateEvent, deleteEvent,
      addCustomHoliday, removeCustomHoliday,
      addEmployeeRoutine, updateEmployeeRoutine, deleteEmployeeRoutine,
      updateEmployeeWorkRule, getEmployeeWorkRule
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};
