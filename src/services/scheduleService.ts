import { supabase } from '@/integrations/supabase/client';
import { ScheduleData, ScheduleSettings, Employee, Shift, Event, Holiday, EmployeeRoutine, EmployeeWorkRule, WorkScale } from '@/types/employee';

// Default constants
const DEFAULT_WORK_SCALES: WorkScale[] = [
  {
    id: '5x2',
    name: 'Escala 5x2',
    type: '5x2',
    workDays: 5,
    restDays: 2,
    weeklyHours: 44,
    dailyHours: 8.8,
    description: 'Trabalha 5 dias e folga 2 dias (sábado e domingo). 44h semanais, 8h48min por dia.'
  },
  {
    id: '6x1',
    name: 'Escala 6x1',
    type: '6x1',
    workDays: 6,
    restDays: 1,
    weeklyHours: 44,
    dailyHours: 7.33,
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
  },
  {
    id: 'radio_5x6_30h',
    name: 'Rádio 5h x 6 dias (30h)',
    type: 'radio_jornalismo',
    workDays: 6,
    restDays: 1,
    weeklyHours: 30,
    dailyHours: 5,
    description: 'Escala para profissionais de rádio: 5 horas diárias por 6 dias na semana (30h semanais).'
  },
  {
    id: 'operador_6x6_36h',
    name: 'Operador 6h x 6 dias (36h)',
    type: 'radio_jornalismo',
    workDays: 6,
    restDays: 1,
    weeklyHours: 36,
    dailyHours: 6,
    description: 'Escala para operadores: 6 horas diárias de segunda a sábado (36h semanais).'
  }
];

export const createDefaultSettings = (): ScheduleSettings => ({
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
  workScales: DEFAULT_WORK_SCALES,
  employeeRoutines: []
});

export const createDefaultScheduleData = (): ScheduleData => ({
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
  settings: createDefaultSettings()
});

export const scheduleService = {
  /**
   * Loads schedule data from Supabase.
   * Parses the JSON blob and ensures all required fields exist.
   */
  async load(): Promise<ScheduleData | null> {
    try {
      const { data: scheduleRecord, error } = await supabase
        .from('schedule_data')
        .select('*')
        .single();
      
      if (error) {
        // If code is PGRST116, it means no rows found (empty table)
        if (error.code === 'PGRST116') {
          return null; // Signals consuming code to use defaults
        }
        throw error;
      }

      if (scheduleRecord && scheduleRecord.data) {
        // Safe parsing with error boundary logic implicit here
        let loadedData: ScheduleData;
        
        if (typeof scheduleRecord.data === 'string') {
          loadedData = JSON.parse(scheduleRecord.data);
        } else {
          loadedData = scheduleRecord.data as unknown as ScheduleData;
        }

        // Merge with defaults to ensure newer properties exist in older JSONs
        if (!loadedData.settings) {
          loadedData.settings = createDefaultSettings();
        } else {
          loadedData.settings = {
            ...createDefaultSettings(),
            ...loadedData.settings
          };
        }
        
        return loadedData;
      }
      
      return null;
    } catch (error) {
      console.error('Error in scheduleService.load:', error);
      throw error;
    }
  },

  /**
   * Saves schedule data to Supabase.
   * Upserts the single JSON blob row.
   */
  async save(data: ScheduleData): Promise<void> {
    try {
      // Create a clean object to save (removing UI-only states if any)
      // JSON.stringify handled automatically by Supabase client for JSONB columns,
      // but current implementation passes a string explicitly. We'll follow the pattern for safety.
      
      const payload = {
        id: 'main',
        data: JSON.stringify(data), // We serialize it ourselves to ensure format
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('schedule_data')
        .upsert(payload);

      if (error) throw error;
      
    } catch (error) {
      console.error('Error in scheduleService.save:', error);
      throw error;
    }
  }
};
