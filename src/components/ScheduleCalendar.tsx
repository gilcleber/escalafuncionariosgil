import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, AlertTriangle, Share2, Save, Printer, RefreshCw, Loader2, Calendar, Download } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { Shift } from '@/types/employee';
import { cn } from '@/lib/utils';
import { isHoliday } from '@/utils/holidays';
import { validateWorkRules } from '@/utils/workRules';
import ShiftEditModal from './ShiftEditModal';
import GameEditModal from './GameEditModal';
import RoutineEditModal from './RoutineEditModal';
import CalendarViewSelector, { CalendarViewType } from './CalendarViewSelector';
import CalendarCompactView from './CalendarCompactView';
import FullScreenSchedule from './FullScreenSchedule';
import { formatTime } from '@/utils/timeUtils';


interface ScheduleCalendarProps {
  isEmployeeView?: boolean;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  isEmployeeView = false
}) => {
  const {
    scheduleData,
    setCurrentMonth,
    saveScheduleData,
    isLoading,
    isSaving,
    deleteShift // Added from context
  } = useSchedule();
  const [calendarView, setCalendarView] = useState<CalendarViewType>('weekly');

  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    employeeId: string;
    date: string;
    shift?: Shift;
    batchTargets?: { employeeId: string; date: string }[];
  }>({
    isOpen: false,
    employeeId: '',
    date: ''
  });
  const [gameModal, setGameModal] = useState<{
    isOpen: boolean;
    date: string;
  }>({
    isOpen: false,
    date: ''
  });
  const [routineModal, setRoutineModal] = useState<{
    isOpen: boolean;
    employeeId: string;
    date: string;
  }>({
    isOpen: false,
    employeeId: '',
    date: ''
  });
  const [shareModal, setShareModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    type: 'month',
    selectedEmployee: '',
    startDate: '',
    endDate: ''
  });

  // State for Selection Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  // Helper for Next Month Name
  const getNextMonthName = () => {
    let nextM = currentMonth + 1;
    let nextY = currentYear;
    if (nextM > 11) {
      nextM = 0;
      nextY = currentYear + 1;
    }
    return `${MONTHS[nextM]} ${nextY}`;
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedCells(new Set()); // Clear on toggle
  };

  const handleCellSelection = (employeeId: string, date: string) => {
    const key = `${employeeId}|${date}`;
    const newSelected = new Set(selectedCells);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCells(newSelected);
  };

  const handleBatchClear = async () => {
    if (!window.confirm(`Deseja limpar ${selectedCells.size} células selecionadas? (Isso removerá os turnos)`)) return;

    // Convert Set to Array
    const cellsToClear = Array.from(selectedCells).map(key => {
      const [empId, date] = key.split('|');
      return { empId, date };
    });

    for (const cell of cellsToClear) {
      const shifts = scheduleData.shifts.filter(s => s.employeeId === cell.empId && s.date === cell.date);
      for (const s of shifts) {
        await deleteShift(s.id);
      }
    }
    setSelectedCells(new Set()); // Deselect after clear
  };

  const handleBatchEdit = () => {
    if (selectedCells.size === 0) return;
    const firstKey = Array.from(selectedCells)[0];
    const [empId, date] = firstKey.split('|');

    const targets = Array.from(selectedCells).map(key => {
      const [e, d] = key.split('|');
      return { employeeId: e, date: d };
    });

    setEditModal({
      isOpen: true,
      employeeId: empId,
      date: date,
      shift: undefined, // Start fresh
      batchTargets: targets
    });
  };

  const currentMonth = scheduleData.month;
  const currentYear = scheduleData.year;

  const isViewOnly = new URLSearchParams(window.location.search).get('view') === 'only';
  const isEmployeeOrViewOnly = isEmployeeView || isViewOnly;

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

  // Function to display multiple shifts - each shift on separate line
  const getMultipleShiftsDisplay = (shifts: Shift[]): React.ReactNode => {
    if (shifts.length === 0) return '';

    return (
      <div className="flex flex-col gap-1">
        {shifts.map((shift, index) => (
          <div key={index} className="text-xs font-medium leading-tight text-center">
            {shift.type === 'work' && shift.startTime && shift.endTime
              ? `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`
              : shift.type === 'dayoff' ? 'FOLGA' :
                shift.type === 'vacation' ? 'FÉRIAS' :
                  shift.type === 'medical' ? 'ATESTADO' :
                    shift.type === 'holiday' ? 'FERIADO' :
                      shift.type === 'breastfeeding' ? 'AMAMENTAÇÃO' :
                        shift.type === 'external' ? 'EXTERNO' :
                          shift.type === 'suspension' ? 'SUSPENSÃO' :
                            shift.type === 'paternity' ? 'PATERNIDADE' :
                              shift.type === 'blood_donation' ? 'DOAÇÃO SANGUE' :
                                shift.type === 'military' ? 'MILITAR' :
                                  shift.type === 'marriage' ? 'CASAMENTO' :
                                    shift.type === 'public_service' ? 'SERVIÇO PÚBLICO' :
                                      shift.type === 'family_death' ? 'ÓBITO FAMÍLIA' :
                                        shift.type === 'deduct_day' ? 'DESCONTO DIA' :
                                          shift.type === 'birthday' ? 'ANIVERSÁRIO' :
                                            ''
            }
          </div>
        ))}
      </div>
    );
  };

  // Function to get color for multiple shifts (uses first shift color)
  const getMultipleShiftsColor = (shifts: Shift[], date: string, isSelected: boolean = false): string => {
    const baseColor = shifts.length > 0 ? getShiftColor(shifts[0], date) : 'neuro-inset bg-neuro-element';

    if (isSelected) {
      return cn(baseColor, "ring-2 ring-blue-600 ring-offset-1 z-10");
    }
    return baseColor;
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(scheduleData.month, scheduleData.year);
    const firstDay = getFirstDayOfMonth(scheduleData.month, scheduleData.year);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };
  const getShiftForEmployeeAndDate = (employeeId: string, date: string): Shift | undefined => {
    return scheduleData.shifts.find(shift => shift.employeeId === employeeId && shift.date === date);
  };
  const formatDate = (day: number) => {
    return `${scheduleData.year}-${(scheduleData.month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };
  const getShiftDisplay = (shift: Shift | undefined, date: string) => {
    const holiday = isHoliday(date, scheduleData.settings.holidays);

    if (holiday && shift && shift.type === 'work') {
      return `E-${shift.startTime} / S-${shift.endTime}`;
    }

    if (holiday && !shift) {
      return holiday.name.substring(0, 8);
    }
    if (!shift) return '';

    switch (shift.type) {
      case 'work':
        return `E-${formatTime(shift.startTime)} / S-${formatTime(shift.endTime)}`;
      case 'dayoff':
        return 'FOLGA';
      case 'holiday':
        return 'TRABALHO REMOTO';
      case 'event':
        return shift.description || 'EVENTO';
      case 'birthday':
        return 'ANIVERSÁRIO';
      case 'breastfeeding':
        return 'AMAMENTAÇÃO';
      case 'medical':
        return 'ATESTADO MÉDICO';
      case 'external':
        return 'SERVIÇO EXTERNO';
      case 'suspension':
        return 'SUSPENSÃO';
      case 'paternity':
        return 'LIC. PATERNIDADE';
      case 'blood_donation':
        return 'DOAÇÃO SANGUE';
      case 'military':
        return 'AFAST. MILITAR';
      case 'marriage':
        return 'LIC. CASAMENTO';
      case 'public_service':
        return 'CONV. ÓRG. PÚBLICO';
      case 'family_death':
        return 'FALEC. FAMILIAR';
      case 'deduct_day':
        return 'DESCONTAR DIA';
      case 'vacation':
        return 'FÉRIAS';
      default:
        return '';
    }
  };

  const getShiftColor = (shift: Shift | undefined, date: string) => {
    const holiday = isHoliday(date, scheduleData.settings.holidays);

    if (holiday) {
      return 'neuro-inset bg-red-100 text-red-800 border-2 border-red-300';
    }
    if (!shift) return 'neuro-inset bg-neuro-element';

    switch (shift.type) {
      case 'work':
        if (shift.startTime && shift.endTime) {
          return 'neuro-inset bg-green-100 text-green-800 border-1 border-green-300';
        }
        return 'neuro-inset bg-gray-100 text-gray-500'; // Invalid/Incomplete
      case 'dayoff':
        return 'neuro-inset bg-yellow-100 text-yellow-800 border-2 border-yellow-300';
      case 'holiday':
        return 'neuro-inset bg-purple-100 text-purple-800 border-2 border-purple-300';
      case 'event':
        return 'neuro-inset bg-green-100 text-green-800 border-2 border-green-300';
      case 'birthday':
        return 'neuro-inset bg-pink-100 text-pink-800 border-2 border-pink-300';
      case 'breastfeeding':
        return 'neuro-inset bg-cyan-100 text-cyan-800 border-2 border-cyan-300';
      case 'medical':
        return 'neuro-inset bg-orange-100 text-orange-800 border-2 border-orange-300';
      case 'external':
        return 'neuro-inset bg-teal-100 text-teal-800 border-2 border-teal-300';
      case 'suspension':
        return 'neuro-inset bg-red-200 text-red-900 border-2 border-red-400';
      case 'paternity':
        return 'neuro-inset bg-indigo-100 text-indigo-800 border-2 border-indigo-300';
      case 'blood_donation':
        return 'neuro-inset bg-red-50 text-red-700 border-2 border-red-200';
      case 'military':
        return 'neuro-inset bg-gray-200 text-gray-800 border-2 border-gray-400';
      case 'marriage':
        return 'neuro-inset bg-rose-100 text-rose-800 border-2 border-rose-300';
      case 'public_service':
        return 'neuro-inset bg-amber-100 text-amber-800 border-2 border-amber-300';
      case 'family_death':
        return 'neuro-inset bg-gray-300 text-gray-900 border-2 border-gray-500';
      case 'deduct_day':
        return 'neuro-inset bg-red-100 text-red-800 border-2 border-red-300';
      case 'vacation':
        return 'neuro-inset bg-green-200 text-green-900 border-2 border-green-400';
      default:
        return 'neuro-inset bg-neuro-element neuro-hover';
    }
  };

  const hasValidationErrors = (employeeId: string) => {
    const violations = validateWorkRules(scheduleData.shifts, employeeId, scheduleData.month, scheduleData.year, scheduleData.settings.workRules);
    return violations.length > 0;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    console.log(`🔄 Navegando ${direction} do mês atual: ${MONTHS[currentMonth]} ${currentYear}`);
    let newMonth = currentMonth;
    let newYear = currentYear;
    if (direction === 'prev') {
      newMonth = currentMonth - 1;
      if (newMonth < 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      }
    } else {
      newMonth = currentMonth + 1;
      if (newMonth > 11) {
        newMonth = 0;
        newYear = currentYear + 1;
      }
    }
    console.log(`📅 Mudando para: ${MONTHS[newMonth]} ${newYear}`);

    setCurrentMonth(newMonth, newYear);
  };
  const getGamesForDate = (date: string) => {
    return scheduleData.settings.events.filter((e: any) => e.date === date);
  };
  const getRoutinesForEmployeeAndDate = (employeeId: string, date: string) => {
    return scheduleData.settings.employeeRoutines.filter((r: any) => r.employeeId === employeeId && r.date === date);
  };

  // Logic moved to Render Loop to support custom styles
  const getRoutineCellColor = (routines: any[]) => {
    if (routines.length === 0) return 'neuro-inset bg-neuro-element';
    return 'neuro-inset bg-purple-50 border-2 border-purple-200';
  };

  const handleCellClick = (employeeId: string, date: string) => {
    if (isEmployeeOrViewOnly) return;

    if (isSelectionMode) {
      handleCellSelection(employeeId, date);
      return;
    }

    const shift = getShiftForEmployeeAndDate(employeeId, date);
    setEditModal({
      isOpen: true,
      employeeId,
      date,
      shift
    });
  };
  const handleGameCellClick = (date: string) => {
    if (isEmployeeOrViewOnly) return;

    setGameModal({
      isOpen: true,
      date
    });
  };
  // ...
  // ...

  const handleRoutineCellClick = (employeeId: string, date: string) => {
    if (isEmployeeOrViewOnly) return;

    setRoutineModal({
      isOpen: true,
      employeeId,
      date
    });
  };

  const generateShareLink = () => {
    const currentUrl = window.location.origin + window.location.pathname;
    return `${currentUrl}?view=only`;
  };
  const copyShareLink = () => {
    const shareLink = generateShareLink();
    navigator.clipboard.writeText(shareLink).then(() => {
      alert('✅ Link copiado para a área de transferência!\n\n📋 INSTRUÇÕES IMPORTANTES:\n• Este link é APENAS PARA VISUALIZAÇÃO\n• Para ver atualizações, sempre aperte F5 na página\n• As alterações feitas no sistema principal aparecerão aqui automaticamente após atualizar');
    });
  };
  const openInNewWindow = () => {
    const shareLink = generateShareLink();
    window.open(shareLink, '_blank');
  };
  const handleSaveSchedule = async () => {
    try {
      await saveScheduleData();
      alert('✅ Escala salva com sucesso!');
    } catch (error) {
      alert('❌ Erro ao salvar escala. Tente novamente.');
    }
  };
  const handleRefreshPage = () => {
    window.location.reload();
  };

  const exportToPDF = () => {
    let htmlContent = '';
    let fileName = '';

    // Gerar conteúdo baseado nas opções selecionadas
    switch (exportOptions.type) {
      case 'employee':
        const employee = scheduleData.employees.find(emp => emp.id === exportOptions.selectedEmployee);
        if (!employee) {
          alert('Por favor, selecione um funcionário.');
          return;
        }
        fileName = `escala-${employee.name.replace(/\s+/g, '-')}-${MONTHS[currentMonth]}-${currentYear}`;
        htmlContent = generateEmployeePDF(employee);
        break;

      case 'week':
        const startDate = new Date(exportOptions.startDate);
        const endDate = new Date(exportOptions.endDate);
        if (!exportOptions.startDate || !exportOptions.endDate) {
          alert('Por favor, selecione as datas de início e fim.');
          return;
        }
        fileName = `escala-semana-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
        htmlContent = generateWeekPDF(startDate, endDate);
        break;

      default: // month
        fileName = `escala-${MONTHS[currentMonth]}-${currentYear}`;
        htmlContent = generateMonthPDF();
        break;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${fileName}</title>
          <meta charset="utf-8">
          <style>
            @page { margin: 15mm; size: A4 landscape; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 10px;
              margin: 0;
              padding: 0;
            }
            h1 { 
              text-align: center; 
              margin-bottom: 15px;
              font-size: 16px;
            }
            h2 {
              font-size: 14px;
              margin: 15px 0 10px 0;
              color: #1e40af;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 5px;
            }
            .calendar-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 10px 0;
              page-break-inside: avoid;
            }
            .calendar-table th, .calendar-table td { 
              border: 1px solid #374151; 
              padding: 3px; 
              text-align: center; 
              font-size: 9px;
              vertical-align: middle;
              height: 35px;
              word-wrap: break-word;
              overflow-wrap: break-word;
              max-width: 80px;
            }
            .employee-name { 
              font-weight: bold; 
              background-color: #f3f4f6;
              writing-mode: vertical-lr;
              text-orientation: mixed;
              width: 25px;
              font-size: 8px;
              max-width: 25px;
            }
            .day-header {
              background-color: #e5e7eb;
              font-weight: bold;
              font-size: 8px;
            }
            .weekend { background-color: #fed7d7; }
            .holiday { background-color: #fc8181; color: white; }
            .work-shift { background-color: #c6f6d5; }
            .dayoff { background-color: #fefcbf; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
    setExportModal(false);
  };

  const generateEmployeePDF = (employee: any) => {
    const daysInMonth = getDaysInMonth(scheduleData.month, scheduleData.year);

    return `
      <h1>Escala Individual - ${employee.name}</h1>
      <h2>${MONTHS[currentMonth]} ${currentYear}</h2>
      <table class="calendar-table">
        <thead>
          <tr>
            <th class="day-header">Dia</th>
            <th class="day-header">Horário</th>
            <th class="day-header">Observações</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = formatDate(day);
      const shift = scheduleData.shifts.find((s: any) => s.employeeId === employee.id && s.date === date);
      const display = getShiftDisplay(shift, date);
      const dateObj = new Date(scheduleData.year, scheduleData.month, day);
      const dayOfWeek = dateObj.getDay();
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      return `<tr>
              <td>${day} - ${dayNames[dayOfWeek]}</td>
              <td>${display}</td>
              <td>${shift?.description || ''}</td>
            </tr>`;
    }).join('')}
        </tbody>
      </table>
    `;
  };

  const generateWeekPDF = (startDate: Date, endDate: Date) => {
    return `
      <h1>Escala Semanal</h1>
      <h2>${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}</h2>
      <table class="calendar-table">
        <thead>
          <tr>
            <th class="employee-name">FUNCIONÁRIO</th>
            <th class="day-header">Data</th>
            <th class="day-header">Horário</th>
          </tr>
        </thead>
        <tbody>
          ${scheduleData.employees.map((employee: any) => {
      return `<tr>
              <td class="employee-name">${employee.name}</td>
              <td colspan="2">Dados da semana...</td>
            </tr>`;
    }).join('')}
        </tbody>
      </table>
    `;
  };

  const generateMonthPDF = () => {
    const daysInMonth = getDaysInMonth(scheduleData.month, scheduleData.year);

    return `
      <h1>Relatório de Escalas - ${MONTHS[currentMonth]} ${currentYear}</h1>
      <table class="calendar-table">
        <thead>
          <tr>
            <th class="employee-name">FUNCIONÁRIO</th>
            ${Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(scheduleData.year, scheduleData.month, day);
      const dayOfWeek = date.getDay();
      const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      return `<th class="day-header">${day}<br>${dayNames[dayOfWeek]}</th>`;
    }).join('')}
          </tr>
        </thead>
        <tbody>
          ${scheduleData.employees.map((employee: any) => {
      return `<tr>
              <td class="employee-name">${employee.name}</td>
              ${Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const date = formatDate(day);
        const shift = scheduleData.shifts.find((s: any) => s.employeeId === employee.id && s.date === date);
        const display = getShiftDisplay(shift, date);
        const dateObj = new Date(scheduleData.year, scheduleData.month, day);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const holiday = isHoliday(date, scheduleData.settings.holidays);

        let className = '';
        if (holiday) className = 'holiday';
        else if (isWeekend) className = 'weekend';
        else if (shift?.type === 'work') className = 'work-shift';
        else if (shift?.type === 'dayoff') className = 'dayoff';

        const truncatedDisplay = display.length > 12 ? display.substring(0, 12) + '...' : display;

        return `<td class="${className}">${truncatedDisplay}</td>`;
      }).join('')}
            </tr>`;
    }).join('')}
        </tbody>
      </table>
    `;
  };

  const calendarDays = generateCalendarDays();
  const weeksCount = Math.ceil(calendarDays.length / 7);

  if (isLoading) {
    return <div className="w-full h-64 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Carregando escala...</span>
      </div>
    </div>;
  }

  const renderCalendarContent = () => {
    if (calendarView === 'compact') {
      return <CalendarCompactView scheduleData={scheduleData} onCellClick={handleCellClick} getShiftForEmployeeAndDate={getShiftForEmployeeAndDate} getShiftDisplay={getShiftDisplay} getShiftColor={getShiftColor} formatDate={formatDate} getDaysInMonth={getDaysInMonth} generateCalendarDays={generateCalendarDays} isEmployeeOrViewOnly={isEmployeeOrViewOnly} isSaving={isSaving} />;
    }

    const WeeklyGrid = () => {
      // LOGIC TO MERGE DUPLICATES AND HIDE INACTIVE
      const visibleEmployees = React.useMemo(() => {
        const map = new Map<string, { display: any, ids: string[] }>();

        scheduleData.employees.forEach((emp: any) => {
          // 1. Hide Inactive (Archived)
          // Also check legacy endDate logic just in case the property exists in memory
          const isActive = emp.isActive ?? emp.active ?? true;
          // const endDate = emp.endDate ? new Date(emp.endDate) : null;
          // if (endDate && endDate < new Date()) return; // Removed endDate from schema, so rely on 'active' flag.

          if (!isActive) return;

          // 2. Group by Name (Merge Duplicates)
          const nameKey = emp.name ? emp.name.trim() : 'Sem Nome';
          if (!map.has(nameKey)) {
            map.set(nameKey, { display: emp, ids: [emp.id] });
          } else {
            map.get(nameKey)!.ids.push(emp.id);
          }
        });

        return Array.from(map.values());
      }, [scheduleData.employees]);

      const getMergedShifts = (ids: string[], date: string) => {
        return ids.flatMap(id => getManagerDefinedShifts(id, date));
      };

      const hasMergedValidationErrors = (ids: string[]) => {
        return ids.some(id => hasValidationErrors(id));
      };

      return (
        <div className="neuro-card p-4 h-full overflow-auto">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="neuro-outset-sm p-2 text-sm font-bold bg-neuro-calendar-header text-center rounded-2xl text-neuro-text-primary">
                  FUNCIONÁRIO
                </div>
                {WEEKDAYS.map((day, index) => <div key={day} className={cn("neuro-outset-sm p-2 text-sm font-bold text-center rounded-2xl", index === 0 ? "bg-neuro-error/10 text-neuro-calendar-weekend" : "bg-neuro-accent/10 text-neuro-calendar-weekday")}>
                  {day}
                </div>)}
              </div>

              {Array.from({
                length: weeksCount
              }, (_, weekIndex) => {
                const weekDays = calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7);
                return <div key={weekIndex} className="mb-4">
                  {/* Days row */}
                  <div className="grid grid-cols-8 gap-2 mb-2">
                    <div></div>
                    {weekDays.map((day, dayIndex) => {
                      const isFirstDayOfWeek = dayIndex === 0;
                      return <div key={dayIndex} className={cn("neuro-inset p-1 text-xs text-center font-bold rounded-2xl bg-neuro-element", day ? "text-neuro-text-primary" : "", isFirstDayOfWeek && day ? "text-neuro-calendar-weekend" : "text-neuro-text-secondary")}>
                        {day || ''}
                      </div>;
                    })}
                  </div>

                  {/* Events row */}
                  <div className="grid grid-cols-8 gap-2 mb-2">
                    <div className="neuro-outset-sm p-2 bg-neuro-warning/20 text-sm font-bold text-center rounded-2xl text-neuro-text-primary">
                      EVENTOS
                    </div>
                    {weekDays.map((day, dayIndex) => {
                      if (!day) return <div key={dayIndex} className="p-2 min-h-[35px]"></div>;
                      const date = formatDate(day);
                      const games = getGamesForDate(date);

                      // Custom Logic for Colors (inline)
                      let customStyle: React.CSSProperties = {};
                      let className = "p-1 min-h-[35px] text-xs transition-all duration-200 rounded-2xl flex items-center justify-center";

                      if (games.length === 1 && games[0].color && games[0].color !== '#000000') {
                        customStyle = { backgroundColor: games[0].color, color: 'white' }; // Apply hex
                        className += " neuro-inset";
                      } else {
                        // Fallback/Default Logic
                        const hasGuarani = games.some((g: any) => g.name.toUpperCase().includes('GUARANI'));
                        const hasPonte = games.some((g: any) => g.name.toUpperCase().includes('PONTE PRETA'));

                        if (hasGuarani && hasPonte) className += " neuro-inset bg-neuro-element";
                        else if (hasGuarani) className += " neuro-inset bg-green-100 text-green-800 border-2 border-green-300";
                        else if (hasPonte) className += " neuro-inset bg-gray-700 text-white border-2 border-gray-600";
                        else className += " neuro-inset bg-neuro-element";
                      }

                      return <div key={`games-${day}`} className={cn(className, !isEmployeeOrViewOnly && !isSaving && "neuro-hover cursor-pointer")} style={customStyle} onClick={() => !isSaving && handleGameCellClick(date)}>
                        <div className="text-center text-xs leading-tight">
                          {games.map((game: any, index: number) => <div key={index} className="mb-1">
                            <div className="font-bold truncate text-neuro-calendar-event" style={customStyle.color ? { color: 'inherit' } : {}}>{game.name}</div>
                            <div className="text-xs text-neuro-text-secondary" style={customStyle.color ? { color: 'inherit', opacity: 0.9 } : {}}>{game.time}</div>
                          </div>)}
                        </div>
                      </div>;
                    })}
                  </div>

                  {/* Employee rows (MERGED & FILTERED) */}
                  {visibleEmployees.map(({ display: employee, ids }) => <div key={`${employee.name}-week${weekIndex}`} className="mb-4">
                    {/* Employee shift row */}
                    <div className="grid grid-cols-8 gap-2 mb-2">
                      <div className={cn("neuro-outset-sm p-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-sm font-bold text-center rounded-xl flex items-center justify-center min-h-[55px] border-2", hasMergedValidationErrors(ids) ? "border-neuro-error bg-neuro-error/10" : "border-blue-500/30")}>
                        <div className="flex items-center gap-1">
                          {hasMergedValidationErrors(ids) && <AlertTriangle className="h-3 w-3 text-neuro-error" />}
                          <span className="font-bold text-blue-600 uppercase tracking-wide">{employee.name}</span>
                        </div>
                      </div>

                      {weekDays.map((day, dayIndex) => {
                        if (!day) return <div key={dayIndex} className="p-2 min-h-[55px]"></div>;
                        const date = formatDate(day);
                        // GET SHIFTS FROM ALL IDS
                        const shifts = getMergedShifts(ids, date);

                        const key = `${ids[0]}|${date}`;
                        const isSelected = selectedCells.has(key);

                        // Use Primary ID for interactions (ids[0])
                        return <div key={`${employee.id}-${day}`} className={cn(getMultipleShiftsColor(shifts, date, isSelected) || "neuro-inset bg-neuro-element", "p-1 min-h-[55px] text-sm transition-all duration-200 rounded-2xl flex items-center justify-center", !isEmployeeOrViewOnly && !isSaving && "neuro-hover cursor-pointer", isSelected && "ring-2 ring-blue-600 ring-offset-1 z-10")} onClick={() => !isSaving && handleCellClick(ids[0], date)}>
                          <div className="font-semibold text-center text-xs leading-tight w-full">
                            {getMultipleShiftsDisplay(shifts)}
                          </div>
                        </div>;
                      })}
                    </div>

                    {/* Employee routine row */}
                    <div className="grid grid-cols-8 gap-2 mb-2">
                      <div className="neuro-outset-sm p-1 text-sm font-bold text-center bg-neuro-accent/20 rounded-2xl min-h-[30px] flex items-center justify-center text-neuro-text-primary">
                        ROTINA/TAREFA
                      </div>

                      {weekDays.map((day, dayIndex) => {
                        if (!day) return <div key={dayIndex} className="p-1 min-h-[30px]"></div>;
                        const date = formatDate(day);
                        // Use Primary ID for routines (assuming routines are not split across duplicates usually)
                        const routines = getRoutinesForEmployeeAndDate(ids[0], date);
                        return <div key={`routine-${employee.id}-${day}`} className={cn(getRoutineCellColor(routines), "p-1 min-h-[30px] text-xs transition-all duration-200 rounded-2xl flex flex-col items-center justify-center gap-0.5", !isEmployeeOrViewOnly && !isSaving && "neuro-hover cursor-pointer")} onClick={() => !isSaving && handleRoutineCellClick(ids[0], date)}>
                          {routines.map((routine: any, routineIndex: number) => <div key={routineIndex} className="text-center w-full">
                            <div className="text-xs font-semibold truncate text-neuro-calendar-routine">{routine.time}</div>
                            <div className="text-xs leading-tight truncate text-neuro-text-primary">{routine.name}</div>
                          </div>)}
                        </div>;
                      })}
                    </div>
                  </div>)}
                </div>;
              })}
            </div>
          </div>
        </div>
      );
    };

    if (calendarView === 'fullscreen') {
      return (
        <FullScreenSchedule
          onClose={() => setCalendarView('weekly')}
          onCellClick={handleCellClick}
          selectionMode={isSelectionMode}
          selectedCells={Array.from(selectedCells)}
          onToggleSelectionMode={toggleSelectionMode}
          onBatchEdit={handleBatchEdit}
          onBatchClear={handleBatchClear}
          openModal={(type, data) => {
            if (type === 'event' && data.date) {
              handleGameCellClick(data.date);
            }
          }}
        />
      );
    }

    return <WeeklyGrid />;
  };











  return <div className="bg-neuro-bg rounded-lg shadow-lg p-6 relative">
    {/* Floating Action Bar for Selection Mode */}
    {isSelectionMode && (
      <div className="sticky top-0 z-50 mb-4 bg-neuro-surface border-2 border-blue-500 rounded-lg p-3 shadow-xl flex items-center justify-between animate-in slide-in-from-top-2">
        <div className="flex items-center gap-4">
          <span className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-sm">
            {selectedCells.size} Selecionados
          </span>
          <span className="text-sm text-gray-600">Clique nas células para selecionar</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCells(new Set())} className="text-red-500 hover:bg-red-50">
            Limpar Seleção (Visual)
          </Button>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <Button variant="secondary" size="sm" onClick={() => setIsSelectionMode(false)}>
            Sair do Modo
          </Button>
          <Button variant="default" size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleBatchEdit} disabled={selectedCells.size === 0}>
            Editar Selecionados ({selectedCells.size})
          </Button>
        </div>
      </div>
    )}

    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className="neuro-button">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-2xl font-bold text-neuro-text-primary uppercase tracking-tight">
          {MONTHS[currentMonth]} {currentYear}
        </h2>

        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className="neuro-button">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={isSelectionMode ? "default" : "outline"}
          size="sm"
          className={cn("neuro-button flex items-center gap-2", isSelectionMode ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300" : "")}
          onClick={toggleSelectionMode}
        >
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isSelectionMode ? "bg-white animate-pulse" : "bg-gray-400")}></div>
            {isSelectionMode ? 'Modo Seleção ATIVO' : 'Modo Seleção Múltipla'}
          </div>
        </Button>

        {/* ... (Existing buttons: ViewOnly Refresh, Save, Share, Export) ... */}
        {isViewOnly && <Button variant="outline" size="sm" className="neuro-button flex items-center gap-2" onClick={handleRefreshPage}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>}
        {!isEmployeeOrViewOnly && !isSelectionMode && <>
          <Button variant="outline" size="sm" className="neuro-button flex items-center gap-2" onClick={handleSaveSchedule} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button variant="outline" size="sm" className="neuro-button flex items-center gap-2" onClick={() => setShareModal(true)}>
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
        </>}
        <Button variant="outline" size="sm" className="neuro-button flex items-center gap-2" onClick={() => setExportModal(true)}>
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>
    </div>

    <CalendarViewSelector currentView={calendarView} onViewChange={setCalendarView} isEmployeeOrViewOnly={isEmployeeOrViewOnly} />

    {isViewOnly && <div className="neuro-inset bg-blue-50 rounded-2xl p-4 text-center mb-4">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Calendar className="h-5 w-5 text-blue-600" />
        <p className="text-blue-800 font-bold text-lg">
          📋 MODO VISUALIZAÇÃO - APENAS PARA CONSULTA
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
        <RefreshCw className="h-4 w-4" />
        <p className="text-sm font-semibold">
          ⚠️ IMPORTANTE: Para ver as atualizações mais recentes, sempre aperte <strong>F5</strong> ou clique no botão "Atualizar" acima
        </p>
      </div>
      <p className="text-xs text-blue-600">
        Esta página não permite edições • As alterações feitas no sistema principal aparecerão aqui automaticamente após atualizar
      </p>
    </div>}

    {isSaving && !isEmployeeOrViewOnly && <div className="neuro-inset bg-yellow-50 rounded-2xl p-3 text-center mb-4">
      <div className="flex items-center justify-center gap-2 text-yellow-800">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-semibold">Salvando alterações...</span>
      </div>
    </div>}

    {renderCalendarContent()}

    <div className="mt-6 neuro-inset p-4 bg-neuro-element rounded-2xl">
      <h3 className="text-sm font-semibold text-neuro-text-primary mb-3">Legenda:</h3>
      {isEmployeeOrViewOnly ? <div className="text-center">
        <span className="text-sm font-bold text-neuro-text-primary">SUJEITO A ALTERAÇÃO</span>
      </div> : <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 rounded border border-blue-300"></div>
          <span className="text-neuro-text-primary">Trabalho</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-100 rounded border border-yellow-300"></div>
          <span className="text-neuro-text-primary">Folga</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 rounded border border-red-300"></div>
          <span className="text-neuro-text-primary">Feriado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 rounded border border-green-300"></div>
          <span className="text-neuro-text-primary">Evento</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-pink-100 rounded border border-pink-300"></div>
          <span className="text-neuro-text-primary">Aniversário</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-cyan-100 rounded border border-cyan-300"></div>
          <span className="text-neuro-text-primary">Amamentação</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-100 rounded border border-orange-300"></div>
          <span className="text-neuro-text-primary">Médico</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-teal-100 rounded border border-teal-300"></div>
          <span className="text-neuro-text-primary">Externo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-200 rounded border border-red-400"></div>
          <span className="text-neuro-text-primary">Suspensão</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-indigo-100 rounded border border-indigo-300"></div>
          <span className="text-neuro-text-primary">Paternidade</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-50 rounded border border-red-200"></div>
          <span className="text-neuro-text-primary">Doação Sangue</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 rounded border border-gray-400"></div>
          <span className="text-neuro-text-primary">Militar</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-rose-100 rounded border border-rose-300"></div>
          <span className="text-neuro-text-primary">Casamento</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-100 rounded border border-amber-300"></div>
          <span className="text-neuro-text-primary">Serviço Público</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-300 rounded border border-gray-500"></div>
          <span className="text-neuro-text-primary">Óbito Família</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-200 rounded border border-green-400"></div>
          <span className="text-neuro-text-primary">Férias</span>
        </div>
        <div className="text-center col-span-full mt-2">
          <span className="text-sm font-bold text-neuro-text-primary">SUJEITO A ALTERAÇÃO</span>
        </div>
      </div>}
    </div>

    {!isEmployeeOrViewOnly && <>
      <ShiftEditModal isOpen={editModal.isOpen} onClose={() => setEditModal({
        isOpen: false,
        employeeId: '',
        date: '',
        shift: undefined,
        batchTargets: undefined
      })} employeeId={editModal.employeeId} date={editModal.date} existingShift={editModal.shift} batchTargets={editModal.batchTargets} />
      <GameEditModal isOpen={gameModal.isOpen} onClose={() => setGameModal({
        isOpen: false,
        date: ''
      })} date={gameModal.date} />
      <RoutineEditModal isOpen={routineModal.isOpen} onClose={() => setRoutineModal({
        isOpen: false,
        employeeId: '',
        date: ''
      })} employeeId={routineModal.employeeId} date={routineModal.date} />
    </>}

    {/* Export Modal */}
    {exportModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="neuro-card bg-neuro-surface p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-neuro-text-primary">
          <Download className="h-5 w-5" />
          Opções de Exportação
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neuro-text-primary mb-2">
              Tipo de Exportação
            </label>
            <Select value={exportOptions.type} onValueChange={(value) => setExportOptions({ ...exportOptions, type: value })}>
              <SelectTrigger className="neuro-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês Completo</SelectItem>
                <SelectItem value="employee">Por Funcionário</SelectItem>
                <SelectItem value="week">Por Período</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportOptions.type === 'employee' && (
            <div>
              <label className="block text-sm font-medium text-neuro-text-primary mb-2">
                Selecionar Funcionário
              </label>
              <Select value={exportOptions.selectedEmployee} onValueChange={(value) => setExportOptions({ ...exportOptions, selectedEmployee: value })}>
                <SelectTrigger className="neuro-input">
                  <SelectValue placeholder="Escolha um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleData.employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {exportOptions.type === 'week' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neuro-text-primary mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  className="neuro-input w-full"
                  value={exportOptions.startDate}
                  onChange={(e) => setExportOptions({ ...exportOptions, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neuro-text-primary mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  className="neuro-input w-full"
                  value={exportOptions.endDate}
                  onChange={(e) => setExportOptions({ ...exportOptions, endDate: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={exportToPDF} className="flex-1 neuro-button">
              <Printer className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => setExportModal(false)} className="flex-1 neuro-button">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>}

    {shareModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="neuro-card bg-neuro-surface p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-neuro-text-primary">
          <Share2 className="h-5 w-5" />
          Compartilhar Escala
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neuro-text-primary mb-2">
              Link para Visualização (Somente Leitura)
            </label>
            <div className="flex gap-2">
              <input type="text" value={generateShareLink()} readOnly className="flex-1 neuro-input p-2 text-sm" />
              <Button onClick={copyShareLink} size="sm" className="neuro-button">
                Copiar
              </Button>
            </div>
          </div>

          <div className="neuro-inset bg-red-50 rounded-2xl p-4">
            <h4 className="font-bold text-red-800 mb-2 text-center">⚠️ INSTRUÇÕES OBRIGATÓRIAS ⚠️</h4>
            <ul className="text-sm text-red-700 space-y-2 font-medium">
              <li>🔒 Este link é <strong>APENAS PARA VISUALIZAÇÃO</strong> - não permite edições</li>
              <li>🔄 Para ver atualizações, os usuários devem <strong>SEMPRE APERTAR F5</strong> na página</li>
              <li>📱 As alterações que você fizer aqui aparecerão automaticamente no link compartilhado</li>
              <li>📋 Instrua TODOS os funcionários a sempre atualizar a página para ver a versão mais recente</li>
              <li>⏰ Recomende que atualizem a página a cada consulta da escala</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={openInNewWindow} className="flex-1 neuro-button">
              Abrir em Nova Janela
            </Button>
            <Button variant="outline" onClick={() => setShareModal(false)} className="flex-1 neuro-button">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>}
  </div>;
};

export default ScheduleCalendar;
