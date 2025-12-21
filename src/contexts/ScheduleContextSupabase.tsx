import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
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
  // --- New Independent Hooks ---
  const { employees, loadingEmployees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { shifts, loadingShifts, addShift, updateShift, deleteShift, createShiftWithAutoEndTime } = useShifts();
  const { settings, loadingSettings, updateSettings, addEvent, updateEvent, deleteEvent, addCustomHoliday, removeCustomHoliday, addEmployeeRoutine, updateEmployeeRoutine, deleteEmployeeRoutine, updateEmployeeWorkRule, getEmployeeWorkRule } = useSettings();

  // Local State for Month/Year (UI Only)
  const [currentDate, setCurrentDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

  // Construct the monolithic 'scheduleData' object for backward compatibility
  const scheduleData: ScheduleData = {
    ...createDefaultScheduleData(),
    employees,
    shifts,
    settings,
    month: currentDate.month,
    year: currentDate.year
  };

  const isLoading = loadingEmployees || loadingShifts || loadingSettings;

  // Sync Holidays (National)
  useEffect(() => {
    if (isLoading) return;
    const nationalHolidays = getBrazilianHolidays(currentDate.year);
    // Note: We don't save national holidays to DB anymore in this loop to avoid spam.
    // They are computed. But if the UI needs them in 'settings.holidays', we inject them here.
    const customHolidays = settings.holidays || [];
    // Just a derived view. 'scheduleData.settings.holidays'
    // Override the settings object on the fly?
    scheduleData.settings.holidays = [...nationalHolidays, ...customHolidays];
  }, [currentDate.year, isLoading, settings.holidays]);

  return (
    <ScheduleContext.Provider value={{
      scheduleData,
      isLoading,
      isSaving: false, // No longer "saving whole file"
      saveScheduleData: () => console.log("Auto-save is active per entity."),

      addEmployee, updateEmployee, deleteEmployee,
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
