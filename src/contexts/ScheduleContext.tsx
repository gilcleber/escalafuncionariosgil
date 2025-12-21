import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Employee, Shift, ScheduleData, ScheduleSettings, Event, Holiday, WorkScale, EmployeeRoutine } from '@/types/employee';
import { getBrazilianHolidays } from '@/utils/holidays';
import { calculateEndTime } from '@/utils/workRules';

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
  createShiftWithAutoEndTime: (employeeId: string, date: string, startTime: string, type: 'work' | 'dayoff' | 'holiday' | 'event', description?: string) => void;
  saveScheduleData: () => void;
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

// Default work scales based on Brazilian labor laws
const defaultWorkScales: WorkScale[] = [
  {
    id: '5x2',
    name: 'Escala 5x2',
    type: '5x2',
    workDays: 5,
    restDays: 2,
    weeklyHours: 44,
    dailyHours: 8.8, // 8h48min
    description: 'Trabalha 5 dias e folga 2 dias (sábado e domingo). 44h semanais, 8h48min por dia.'
  },
  {
    id: '6x1',
    name: 'Escala 6x1',
    type: '6x1',
    workDays: 6,
    restDays: 1,
    weeklyHours: 44,
    dailyHours: 7.33, // 7h20min
    description: 'Trabalha 6 dias e folga 1 dia. 44h semanais, 7h20min por dia.'
  },
  {
    id: '12x36',
    name: 'Escala 12x36',
    type: '12x36',
    workDays: 1,
    restDays: 1.5,
    weeklyHours: 36,
    dailyHours: 12,
    description: 'Trabalha 12 horas seguidas e folga 36 horas. 36h semanais.'
  },
  {
    id: '24x48',
    name: 'Escala 24x48',
    type: '24x48',
    workDays: 1,
    restDays: 2,
    weeklyHours: 28,
    dailyHours: 24,
    description: 'Trabalha 24 horas seguidas e folga 48 horas. 28h semanais.'
  },
  {
    id: 'revezamento',
    name: 'Escala de Revezamento',
    type: 'revezamento',
    workDays: 5,
    restDays: 2,
    weeklyHours: 44,
    dailyHours: 8.8,
    description: 'Revezamento em diferentes turnos conforme acordo coletivo.'
  },
  {
    id: 'tempo_parcial',
    name: 'Tempo Parcial',
    type: 'tempo_parcial',
    workDays: 5,
    restDays: 2,
    weeklyHours: 25,
    dailyHours: 5,
    description: 'Trabalho em tempo parcial, até 25 horas semanais.'
  }
];

// Load data from localStorage
const loadScheduleData = (): ScheduleData => {
  try {
    const saved = localStorage.getItem('scheduleData');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Remove timestamp if it exists
      const { lastUpdated, ...cleanData } = parsed;
      return cleanData;
    }
  } catch (error) {
    console.error('Error loading schedule data:', error);
  }
  
  // Return default data if nothing saved or error
  return {
    employees: [
      {
        id: '1',
        name: 'DANILO',
        position: 'Operador',
        defaultShift: 'E-07h00 / S-13h00'
      },
      {
        id: '2',
        name: 'LEANDRO',
        position: 'Supervisor',
        defaultShift: 'E-08h00 / S-17h00'
      },
      {
        id: '3',
        name: 'PEDRO',
        position: 'Técnico',
        defaultShift: 'E-14h00 / S-22h00'
      },
      {
        id: '4',
        name: 'LUCAS',
        position: 'Operador',
        defaultShift: 'E-14h00 / S-20h00'
      }
    ],
    shifts: [],
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    settings: {
      shiftTemplates: [
        { id: '1', name: 'Manhã', startTime: '07:00', endTime: '13:00', color: 'bg-blue-200' },
        { id: '2', name: 'Tarde', startTime: '14:00', endTime: '20:00', color: 'bg-green-200' },
        { id: '3', name: 'Noite', startTime: '22:00', endTime: '04:00', color: 'bg-purple-200' },
        { id: '4', name: 'Administrativo', startTime: '08:00', endTime: '17:00', color: 'bg-orange-200' }
      ],
      workRules: {
        maxConsecutiveDays: 6,
        maxSundaysPerMonth: 3,
        workHoursPerDay: 6,
        holidayCountsAsWork: false
      },
      holidays: [],
      events: [],
      employeeWorkRules: [],
      workScales: defaultWorkScales,
      employeeRoutines: []
    }
  };
};

// Save data to localStorage with sync across tabs
const saveScheduleData = (data: ScheduleData) => {
  try {
    const dataWithTimestamp = {
      ...data,
      lastUpdated: Date.now()
    };
    localStorage.setItem('scheduleData', JSON.stringify(dataWithTimestamp));
    
    // Sync across tabs using storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'scheduleData',
      newValue: JSON.stringify(dataWithTimestamp),
      oldValue: null,
      storageArea: localStorage,
      url: window.location.href
    }));
    
    console.log('✅ Dados salvos e sincronizados automaticamente');
  } catch (error) {
    console.error('Error saving schedule data:', error);
  }
};

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [scheduleData, setScheduleData] = useState<ScheduleData>(loadScheduleData);

  // Listen for updates from other tabs using storage event
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'scheduleData' && event.newValue) {
        try {
          const newData = JSON.parse(event.newValue);
          const { lastUpdated, ...cleanData } = newData;
          setScheduleData(cleanData);
          console.log('🔄 Dados sincronizados automaticamente de outra aba');
        } catch (error) {
          console.error('Error parsing storage data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    saveScheduleData(scheduleData);
  }, [scheduleData]);

  // Load holidays automatically when month/year changes
  useEffect(() => {
    const nationalHolidays = getBrazilianHolidays(scheduleData.year);
    setScheduleData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        holidays: [
          ...nationalHolidays,
          ...prev.settings.holidays.filter(h => h.type === 'custom')
        ]
      }
    }));
  }, [scheduleData.year]);

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString()
    };
    setScheduleData(prev => ({
      ...prev,
      employees: [...prev.employees, newEmployee]
    }));
  };

  const updateEmployee = (id: string, employee: Partial<Employee>) => {
    setScheduleData(prev => ({
      ...prev,
      employees: prev.employees.map(emp => 
        emp.id === id ? { ...emp, ...employee } : emp
      )
    }));
  };

  const deleteEmployee = (id: string) => {
    setScheduleData(prev => ({
      ...prev,
      employees: prev.employees.filter(emp => emp.id !== id),
      shifts: prev.shifts.filter(shift => shift.employeeId !== id)
    }));
  };

  const addShift = (shift: Omit<Shift, 'id'>) => {
    const newShift: Shift = {
      ...shift,
      id: Date.now().toString()
    };
    setScheduleData(prev => ({
      ...prev,
      shifts: [...prev.shifts, newShift]
    }));
  };

  const updateShift = (id: string, shift: Partial<Shift>) => {
    setScheduleData(prev => ({
      ...prev,
      shifts: prev.shifts.map(s => 
        s.id === id ? { ...s, ...shift } : s
      )
    }));
  };

  const deleteShift = (id: string) => {
    setScheduleData(prev => ({
      ...prev,
      shifts: prev.shifts.filter(shift => shift.id !== id)
    }));
  };

  const setCurrentMonth = (month: number, year: number) => {
    setScheduleData(prev => ({
      ...prev,
      month,
      year
    }));
  };

  const updateSettings = (settings: Partial<ScheduleSettings>) => {
    setScheduleData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
  };

  const addEvent = (event: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString()
    };
    setScheduleData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        events: [...prev.settings.events, newEvent]
      }
    }));
  };

  const updateEvent = (id: string, event: Partial<Event>) => {
    setScheduleData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        events: prev.settings.events.map(e => 
          e.id === id ? { ...e, ...event } : e
        )
      }
    }));
  };

  const deleteEvent = (id: string) => {
    setScheduleData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        events: prev.settings.events.filter(e => e.id !== id)
      }
    }));
  };

  const addEmployeeRoutine = (routine: Omit<EmployeeRoutine, 'id'>) => {
    const newRoutine: EmployeeRoutine = {
      ...routine,
      id: Date.now().toString()
    };
    setScheduleData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        employeeRoutines: [...prev.settings.employeeRoutines, newRoutine]
      }
    }));
  };

  const updateEmployeeRoutine = (id: string, routine: Partial<EmployeeRoutine>) => {
    setScheduleData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        employeeRoutines: prev.settings.employeeRoutines.map(r => 
          r.id === id ? { ...r, ...routine } : r
        )
      }
    }));
  };

  const deleteEmployeeRoutine = (id: string) => {
    setScheduleData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        employeeRoutines: prev.settings.employeeRoutines.filter(r => r.id !== id)
      }
    }));
  };

  const addCustomHoliday = (holiday: Holiday) => {
    setScheduleData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        holidays: [...prev.settings.holidays, holiday]
      }
    }));
  };

  const removeCustomHoliday = (date: string) => {
    setScheduleData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        holidays: prev.settings.holidays.filter(h => h.date !== date)
      }
    }));
  };

  const createShiftWithAutoEndTime = (
    employeeId: string, 
    date: string, 
    startTime: string, 
    type: 'work' | 'dayoff' | 'holiday' | 'event', 
    description?: string
  ) => {
    const endTime = type === 'work' ? calculateEndTime(startTime, scheduleData.settings.workRules.workHoursPerDay) : startTime;
    
    // Remove existing shift for this employee and date
    const existingShiftId = scheduleData.shifts.find(s => s.employeeId === employeeId && s.date === date)?.id;
    if (existingShiftId) {
      deleteShift(existingShiftId);
    }
    
    addShift({
      employeeId,
      date,
      startTime,
      endTime,
      type,
      description
    });
  };

  const manualSaveScheduleData = () => {
    saveScheduleData(scheduleData);
  };

  return (
    <ScheduleContext.Provider value={{
      scheduleData,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addShift,
      updateShift,
      deleteShift,
      setCurrentMonth,
      updateSettings,
      addEvent,
      updateEvent,
      deleteEvent,
      addEmployeeRoutine,
      updateEmployeeRoutine,
      deleteEmployeeRoutine,
      addCustomHoliday,
      removeCustomHoliday,
      createShiftWithAutoEndTime,
      saveScheduleData: manualSaveScheduleData
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};
