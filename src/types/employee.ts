

export interface Employee {
  id: string;
  name: string;
  position: string;
  defaultShift: string;
  workScale?: WorkScale;
  active?: boolean;
  endDate?: string | null;
  displayOrder?: number;
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'work' | 'dayoff' | 'holiday' | 'event' | 'birthday' | 'breastfeeding' | 'medical' | 'external' | 'suspension' | 'paternity' | 'blood_donation' | 'military' | 'marriage' | 'public_service' | 'family_death' | 'deduct_day' | 'vacation';
  description?: string;
  color?: string;
}

export interface WorkRule {
  maxConsecutiveDays: number;
  maxSundaysPerMonth: number;
  workHoursPerDay: number;
  holidayCountsAsWork: boolean;
}

export interface WorkScale {
  id: string;
  name: string;
  type: '5x2' | '6x1' | '12x36' | '24x48' | 'revezamento' | 'tempo_parcial' | 'radio_jornalismo' | 'personalizada';
  workDays: number;
  restDays: number;
  weeklyHours: number;
  dailyHours: number;
  description: string;
}

export interface EmployeeWorkRule {
  employeeId: string;
  workScale: WorkScale;
  customRules?: Partial<WorkRule>;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color?: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  description?: string;
  type?: 'common' | 'national_holiday' | 'optional_holiday' | 'company_event' | 'custom_holiday';
  color?: string;
}

export interface EmployeeRoutine {
  id: string;
  employeeId: string;
  name: string;
  date: string;
  time: string;
  description?: string;
  color?: string;
}

export interface Holiday {
  date: string;
  name: string;
  type: 'national' | 'custom';
}

export interface CompanyProfile {
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  description?: string;
}

export interface DepartmentTemplate {
  id: string;
  name: string;
  description: string;
  defaultWorkScale: string;
  defaultShifts: string[];
}

export interface ScheduleSettings {
  shiftTemplates: ShiftTemplate[];
  workRules: WorkRule;
  holidays: Holiday[];
  events: Event[];
  employeeWorkRules: EmployeeWorkRule[];
  workScales: WorkScale[];
  employeeRoutines: EmployeeRoutine[];
  companyProfile?: CompanyProfile;
  departmentTemplates?: DepartmentTemplate[];
}

export interface ScheduleData {
  employees: Employee[];
  shifts: Shift[];
  month: number;
  year: number;
  settings: ScheduleSettings;
}

