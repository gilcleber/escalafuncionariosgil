
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
        <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden">
            {/* HEADER AZUL */}
            <div className="bg-blue-900 text-white p-2 flex items-center justify-between shadow-md shrink-0 h-14">
                <div className="flex items-center gap-4">
                    {/* Placeholder for left side controls if any */}
                </div>
                <h1 className="text-xl font-bold tracking-wider uppercase">
                    {MONTHS[month]} {year}
                    {/* Note: User wanted 'DEZEMBRO 2025 - JANEIRO 2026', we can logic this later if needed, mostly it's single month context */}
                </h1>
                <Button
                    variant="ghost"
                    className="text-white hover:bg-blue-800 hover:text-white"
                    onClick={onClose}
                >
                    <span className="mr-2">Sair do Modo Tela Cheia</span>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Tabela com Scroll Horizontal e Vertical */}
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-max min-w-full border-collapse">
                    <thead className="sticky top-0 z-20 bg-white shadow-sm">
                        <tr>
                            {/* Coluna Fixa: FUNCS. */}
                            <th className="sticky left-0 z-30 bg-blue-800 text-white min-w-[150px] p-2 border border-blue-900 text-xs font-bold uppercase tracking-wider shadow-md">
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
                                    <th key={day} className={cn("min-w-[100px] p-1 border border-gray-300 text-center", headerColor)}>
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
                                    <td key={day} className="border border-gray-200 p-1 align-top bg-white/50 h-[50px]">
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
                            // Show if active OR has shifts in this month
                            const isActive = employee.active !== false;
                            const hasShifts = shifts.some(s => s.employeeId === employee.id);
                            return isActive || hasShifts;
                        })
                            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
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
                                            <td key={day} className="border border-gray-200 p-1 h-[60px] align-middle hover:bg-gray-50 transition-colors">
                                                {renderShiftContent(shifts)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Legenda Fixa no Rodapé (Opcional, based on mockup) */}
            <div className="bg-gray-100 p-2 border-t border-gray-300 flex items-center justify-center gap-4 text-[10px] text-gray-600 shrink-0">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-blue-200 rounded-full"></div> Trabalho</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded-full"></div> Folga</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-200 rounded-full"></div> Férias</div>
                <span>| &copy; Escala Funcionários</span>
            </div>
        </div>
    );
};

export default FullScreenSchedule;
