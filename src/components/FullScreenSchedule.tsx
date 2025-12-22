
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shift } from '@/types/employee';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { isHoliday } from '@/utils/holidays';
import { validateWorkRules } from '@/utils/workRules';

interface FullScreenScheduleProps {
    onClose: () => void;
}

const MONTHS = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const FullScreenSchedule: React.FC<FullScreenScheduleProps> = ({ onClose }) => {
    const { scheduleData } = useSchedule();
    const { month, year, employees, shifts, settings } = scheduleData;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Helper: Get Shifts for Employee/Date
    const getShifts = (employeeId: string, date: string): Shift[] => {
        return shifts.filter(s => s.employeeId === employeeId && s.date === date);
    };

    // Helper: Get Events for Date
    const getEvents = (date: string) => {
        return settings.events.filter((e: any) => e.date === date);
    };

    const formatDate = (day: number) => {
        return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    };

    const getDayHeaderColor = (dateObj: Date, isHolidayDate: boolean) => {
        const dayOfWeek = dateObj.getDay();
        if (isHolidayDate) return 'bg-red-600 text-white'; // Holiday
        if (dayOfWeek === 0) return 'bg-red-600 text-white'; // Sunday
        if (dayOfWeek === 6) return 'bg-yellow-400 text-black'; // Saturday (Gold/Yellow)
        return 'bg-blue-600 text-white'; // Weekday
    };

    const renderShiftContent = (shifts: Shift[]) => {
        if (!shifts.length) return null;
        return (
            <div className="flex flex-col gap-1 items-center justify-center h-full w-full">
                {shifts.map((shift, i) => {
                    let content = '';
                    let styleClass = 'bg-gray-100 text-gray-800 border-gray-300'; // Default

                    if (shift.type === 'work' && shift.startTime && shift.endTime) {
                        content = `${shift.startTime}-${shift.endTime}`;
                        styleClass = 'bg-white border-2 border-blue-200 text-blue-800 font-semibold rounded-full px-2 py-0.5 text-[10px] shadow-sm';
                    } else if (shift.type === 'dayoff') {
                        content = 'FOLGA';
                        styleClass = 'bg-yellow-100 border-2 border-yellow-200 text-yellow-800 font-bold rounded-full px-2 py-0.5 text-[10px]';
                    } else {
                        // Fallback for other types
                        content = shift.type.toUpperCase().substring(0, 10);
                        styleClass = 'bg-gray-100 border border-gray-200 text-gray-700 text-[9px] rounded px-1';
                        if (shift.type === 'vacation') { content = 'FÉRIAS'; styleClass = 'bg-green-100 border-green-200 text-green-800'; }
                    }

                    return (
                        <div key={i} className={styleClass}>
                            {content}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
            {/* Header minimalista para sair */}
            {/* Header com estilo PWA (Azul Escuro Profundo) */}
            <div className="bg-[#1a365d] text-white px-4 py-3 flex items-center justify-between shadow-lg shrink-0 z-[101]">
                <h1 className="text-xl font-bold tracking-wider uppercase flex-1 text-center font-mono">
                    {MONTHS[month]} {year}
                </h1>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 active:bg-white/30 absolute right-4 top-3"
                    onClick={onClose}
                >
                    <span className="mr-2 font-bold uppercase">Sair</span>
                    <X className="h-6 w-6" />
                </Button>
            </div>

            {/* Tabela Full Width sem margens */}
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20 bg-white shadow-sm">
                        <tr>
                            {/* Coluna Fixa: FUNCS. */}
                            <th className="sticky left-0 z-30 bg-blue-800 text-white w-[150px] min-w-[150px] p-2 border border-blue-900 text-xs font-bold uppercase tracking-wider shadow-md">
                                FUNCS.
                            </th>
                            {/* Dias do Mês */}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const dateStr = formatDate(day);
                                const dateObj = new Date(year, month, day);
                                const dayOfWeek = dateObj.getDay(); // 0=Dom, 1=Seg...
                                const isHol = isHoliday(dateStr, settings.holidays);
                                const headerColor = getDayHeaderColor(dateObj, !!isHol);

                                return (
                                    <th key={day} className={cn("min-w-[60px] p-1 border border-gray-300 text-center", headerColor)}>
                                        <div className="flex flex-col items-center justify-center leading-tight">
                                            <span className="text-[10px] font-medium uppercase">{WEEKDAYS[dayOfWeek]}</span>
                                            <span className="text-lg font-bold">{day.toString().padStart(2, '0')}</span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Linha de EVENTOS */}
                        <tr className="bg-orange-50/50">
                            <th className="sticky left-0 z-10 bg-orange-100 text-orange-900 min-w-[150px] p-2 border border-orange-200 text-xs font-bold uppercase shadow-sm">
                                EVENTOS
                            </th>
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const dateStr = formatDate(day);
                                const events = getEvents(dateStr);

                                return (
                                    <td key={day} className="border border-gray-200 p-1 align-top bg-white/50 h-[40px]">
                                        {events.map((ev: any, idx: number) => (
                                            <div key={idx} className="bg-black text-white text-[9px] font-bold px-1 py-0.5 rounded mb-1 text-center truncate">
                                                {ev.name} {ev.time}
                                            </div>
                                        ))}
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Linhas de Funcionários */}
                        {employees.filter(employee => {
                            // Show if active OR has shifts in THIS month
                            const isActive = employee.active !== false;
                            const currentMonthPrefix = `${year}-${(month + 1).toString().padStart(2, '0')}`;
                            const hasShiftsInMonth = shifts.some(s => s.employeeId === employee.id && s.date.startsWith(currentMonthPrefix));

                            // If active, always show. If inactive, only show if they worked this month.
                            return isActive || hasShiftsInMonth;
                        })
                            // Sort by name since displayOrder is currently disabled/unreliable
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((employee: any, empIndex: number) => (
                                <tr key={employee.id} className={cn(empIndex % 2 === 0 ? "bg-white" : "bg-blue-50/30")}>
                                    <th className="sticky left-0 z-10 bg-blue-100 text-blue-900 min-w-[150px] p-2 border-r border-b border-blue-200 text-xs font-bold uppercase shadow-sm">
                                        {employee.name}
                                    </th>
                                    {Array.from({ length: daysInMonth }, (_, i) => {
                                        const day = i + 1;
                                        const dateStr = formatDate(day);
                                        const shifts = getShifts(employee.id, dateStr);

                                        return (
                                            <td key={day} className="border border-gray-200 p-0 h-[50px] align-middle hover:bg-gray-50 transition-colors relative">
                                                {renderShiftContent(shifts)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FullScreenSchedule;
