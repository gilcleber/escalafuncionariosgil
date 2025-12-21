
import { Holiday } from '@/types/employee';

export const getBrazilianHolidays = (year: number): Holiday[] => {
  const holidays: Holiday[] = [
    { date: `${year}-01-01`, name: 'Confraternização Universal', type: 'national' },
    { date: `${year}-04-21`, name: 'Tiradentes', type: 'national' },
    { date: `${year}-05-01`, name: 'Dia do Trabalhador', type: 'national' },
    { date: `${year}-09-07`, name: 'Independência do Brasil', type: 'national' },
    { date: `${year}-10-12`, name: 'Nossa Senhora Aparecida', type: 'national' },
    { date: `${year}-11-02`, name: 'Finados', type: 'national' },
    { date: `${year}-11-15`, name: 'Proclamação da República', type: 'national' },
    { date: `${year}-12-25`, name: 'Natal', type: 'national' },
  ];

  // Calculate Easter and related holidays
  const easter = calculateEaster(year);
  const carnival = new Date(easter);
  carnival.setDate(easter.getDate() - 47);
  
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);

  holidays.push(
    { 
      date: formatDate(carnival), 
      name: 'Carnaval', 
      type: 'national' 
    },
    { 
      date: formatDate(goodFriday), 
      name: 'Sexta-feira Santa', 
      type: 'national' 
    },
    { 
      date: formatDate(easter), 
      name: 'Páscoa', 
      type: 'national' 
    }
  );

  return holidays;
};

const calculateEaster = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
};

const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

export const isHoliday = (date: string, holidays: Holiday[]): Holiday | undefined => {
  return holidays.find(holiday => holiday.date === date);
};
