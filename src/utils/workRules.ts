import { Shift, WorkRule, Employee } from '@/types/employee';

export const validateWorkRules = (
  shifts: Shift[], 
  employeeId: string, 
  month: number, 
  year: number, 
  rules: WorkRule
) => {
  const violations: string[] = [];
  const employeeShifts = shifts.filter(s => s.employeeId === employeeId);
  
  // Check consecutive work days (considering previous month)
  const consecutiveDays = getConsecutiveWorkDaysWithPreviousMonth(employeeShifts, month, year);
  if (consecutiveDays >= 7) {
    violations.push(`BLOQUEADO: ${consecutiveDays} dias consecutivos de trabalho. Máximo permitido: 6 dias`);
  } else if (consecutiveDays > rules.maxConsecutiveDays) {
    violations.push(`Mais de ${rules.maxConsecutiveDays} dias consecutivos de trabalho`);
  }
  
  // Check Sunday work frequency (considering previous month) - FIXED
  const consecutiveSundays = getConsecutiveSundaysWorked(employeeShifts, month, year);
  console.log(`🎯 Employee ${employeeId} has ${consecutiveSundays} consecutive Sundays worked`);
  if (consecutiveSundays >= 4) {
    violations.push(`BLOQUEADO: ${consecutiveSundays} domingos consecutivos trabalhados. Máximo permitido: 3 domingos`);
  }
  
  // Check interjornada (minimum rest between shifts) - FIXED: Only between different days
  const interjornadaViolations = checkInterjornadaWithPreviousMonth(employeeShifts, month, year);
  violations.push(...interjornadaViolations);
  
  return violations;
};

export const checkInterjornadaWithPreviousMonth = (shifts: Shift[], month: number, year: number): string[] => {
  const violations: string[] = [];
  
  // Get shifts from current and previous month
  const currentMonthStart = new Date(year, month, 1);
  const previousMonthStart = new Date(year, month - 1, 1);
  const nextMonthStart = new Date(year, month + 1, 1);
  
  const relevantShifts = shifts
    .filter(s => {
      const shiftDate = new Date(s.date);
      return s.type === 'work' && shiftDate >= previousMonthStart && shiftDate < nextMonthStart;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (let i = 0; i < relevantShifts.length - 1; i++) {
    const currentShift = relevantShifts[i];
    const nextShift = relevantShifts[i + 1];
    
    // FIXED: Skip interjornada check if shifts are on the same day
    if (currentShift.date === nextShift.date) {
      console.log(`⏭️ Skipping interjornada check for same day shifts: ${currentShift.date}`);
      continue;
    }
    
    // Calculate end time of current shift
    const currentDate = new Date(currentShift.date);
    const [currentEndHours, currentEndMinutes] = currentShift.endTime.split(':').map(Number);
    currentDate.setHours(currentEndHours, currentEndMinutes, 0, 0);
    
    // If end time is before start time (crosses midnight), add one day
    const [currentStartHours] = currentShift.startTime.split(':').map(Number);
    if (currentEndHours < currentStartHours) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate start time of next shift
    const nextDate = new Date(nextShift.date);
    const [nextStartHours, nextStartMinutes] = nextShift.startTime.split(':').map(Number);
    nextDate.setHours(nextStartHours, nextStartMinutes, 0, 0);
    
    // Calculate time difference in hours
    const timeDifference = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
    
    // Check if interjornada is less than 11 hours (only between different days)
    if (timeDifference < 11 && timeDifference >= 0) {
      const formattedCurrentDate = currentDate.toLocaleDateString('pt-BR');
      const formattedNextDate = nextDate.toLocaleDateString('pt-BR');
      violations.push(
        `Interjornada insuficiente: ${timeDifference.toFixed(1)}h entre ${formattedCurrentDate} (${currentShift.endTime}) e ${formattedNextDate} (${nextShift.startTime}). Mínimo: 11h`
      );
    }
  }
  
  return violations;
};

export const getConsecutiveWorkDaysWithPreviousMonth = (shifts: Shift[], month: number, year: number): number => {
  // Create array of all days from previous month to current month
  const previousMonth = month === 0 ? 11 : month - 1;
  const previousYear = month === 0 ? year - 1 : year;
  
  const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  
  const allDays: { date: string, isWork: boolean }[] = [];
  
  // Add previous month days
  for (let day = 1; day <= daysInPreviousMonth; day++) {
    const date = `${previousYear}-${(previousMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const shift = shifts.find(s => s.date === date);
    allDays.push({ date, isWork: shift?.type === 'work' });
  }
  
  // Add current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const date = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const shift = shifts.find(s => s.date === date);
    allDays.push({ date, isWork: shift?.type === 'work' });
  }
  
  // Find maximum consecutive work days
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  
  for (const day of allDays) {
    if (day.isWork) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }
  
  return maxConsecutive;
};

// COMPLETELY REWRITTEN: Fixed Sunday consecutive counting logic
export const getConsecutiveSundaysWorked = (shifts: Shift[], month: number, year: number): number => {
  console.log('🔍 Checking consecutive Sundays for month:', month + 1, 'year:', year);
  
  // Get all Sundays from previous 3 months to current month (to capture all scenarios)
  const allSundays: { date: string, dateObj: Date }[] = [];
  
  // Start from 3 months ago
  for (let monthOffset = -3; monthOffset <= 0; monthOffset++) {
    const checkMonth = month + monthOffset;
    const checkYear = checkMonth < 0 ? year - 1 : year;
    const normalizedMonth = checkMonth < 0 ? checkMonth + 12 : checkMonth;
    
    const daysInMonth = new Date(checkYear, normalizedMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(checkYear, normalizedMonth, day);
      if (dateObj.getDay() === 0) { // Sunday
        const dateString = `${checkYear}-${(normalizedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        allSundays.push({ date: dateString, dateObj });
      }
    }
  }
  
  // Sort by date
  allSundays.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  
  console.log('📅 All Sundays found:', allSundays.map(s => s.date));
  
  // Find the longest sequence of consecutive Sundays worked
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  
  for (let i = 0; i < allSundays.length; i++) {
    const sunday = allSundays[i];
    const shift = shifts.find(s => s.date === sunday.date && s.type === 'work');
    
    console.log(`🔍 Checking Sunday ${sunday.date}:`, shift ? 'WORKED' : 'NOT WORKED');
    
    if (shift) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      console.log(`✅ Current consecutive: ${currentConsecutive}, Max: ${maxConsecutive}`);
    } else {
      console.log(`🛑 Sunday not worked, resetting consecutive count`);
      currentConsecutive = 0;
    }
  }
  
  console.log(`🎯 Final max consecutive Sundays: ${maxConsecutive}`);
  return maxConsecutive;
};

// DEPRECATED: Remove old function
export const getSundayWorkCountWithPreviousMonth = (shifts: Shift[], month: number, year: number): number => {
  return getConsecutiveSundaysWorked(shifts, month, year);
};

export const calculateEndTime = (startTime: string, workHours: number = 6): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + (workHours * 60 * 60 * 1000));
  
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
};

// Helper function to validate a new shift against interjornada rules
export const validateNewShift = (
  newShift: { employeeId: string; date: string; startTime: string; endTime: string },
  existingShifts: Shift[]
): string[] => {
  const violations: string[] = [];
  const employeeShifts = existingShifts.filter(s => s.employeeId === newShift.employeeId && s.type === 'work');
  
  // Create a temporary shift array including the new shift
  const tempShifts = [...employeeShifts, {
    id: 'temp',
    employeeId: newShift.employeeId,
    date: newShift.date,
    startTime: newShift.startTime,
    endTime: newShift.endTime,
    type: 'work' as const
  }];
  
  // Get month and year from the new shift date
  const shiftDate = new Date(newShift.date);
  const month = shiftDate.getMonth();
  const year = shiftDate.getFullYear();
  
  // Check interjornada violations (only between different days)
  const interjornadaViolations = checkInterjornadaWithPreviousMonth(tempShifts, month, year);
  violations.push(...interjornadaViolations);
  
  // Check consecutive days with new shift
  const consecutiveDays = getConsecutiveWorkDaysWithPreviousMonth(tempShifts, month, year);
  if (consecutiveDays >= 7) {
    violations.push(`BLOQUEADO: Tentativa de criar ${consecutiveDays}º dia consecutivo de trabalho. Máximo permitido: 6 dias`);
  }
  
  // Check Sunday work with new shift - FIXED
  const shiftDateObj = new Date(newShift.date);
  if (shiftDateObj.getDay() === 0) { // If the new shift is on a Sunday
    const consecutiveSundays = getConsecutiveSundaysWorked(tempShifts, month, year);
    console.log(`🚨 New Sunday shift validation: ${consecutiveSundays} consecutive Sundays`);
    if (consecutiveSundays >= 4) {
      violations.push(`BLOQUEADO: Tentativa de criar ${consecutiveSundays}º domingo consecutivo de trabalho. Máximo permitido: 3 domingos`);
    }
  }
  
  return violations;
};
