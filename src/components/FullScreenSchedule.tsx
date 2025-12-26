
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Calendar as CalendarIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shift } from '@/types/employee';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { isHoliday } from '@/utils/holidays';
import { validateWorkRules } from '@/utils/workRules';

interface FullScreenScheduleProps {
    onClose: () => void;
    onCellClick: (employeeId: string, date: string) => void;
    selectionMode: boolean;
    selectedCells: string[];
    onToggleSelectionMode: () => void;
    onBatchEdit: () => void;
    onBatchClear: () => void;
}

const MONTHS = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const FullScreenSchedule: React.FC<FullScreenScheduleProps> = ({
    onClose,
    onCellClick,
    selectionMode,
    selectedCells,
    onToggleSelectionMode,
    onBatchEdit,
    onBatchClear
}) => {
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
            {/* Header com estilo PWA (Azul Escuro Profundo) */}
            <div className="bg-[#1a365d] text-white py-1 shadow-lg shrink-0 z-[101] relative min-h-[50px] flex flex-col items-center justify-center select-none">

                {/* Linha Superior: Nome da Empresa */}
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-blue-200/80 mb-0">
                    {settings.companyProfile?.name || 'RADIO BANDEIRANTES'}
                </div>

                {/* Linha Principal: Setas e Data */}
                <div className="flex items-center justify-center gap-6 mt-0">
                    <ArrowLeft className="h-6 w-6 text-red-600 cursor-pointer hover:text-red-500 transition-colors" />

                    <h1 className="text-2xl font-black tracking-widest uppercase font-mono whitespace-nowrap text-white drop-shadow-md">
                        {MONTHS[month]} {year} - {MONTHS[(month + 1) % 12]} {month === 11 ? year + 1 : year}
                    </h1>

                    <ArrowRight className="h-6 w-6 text-red-600 cursor-pointer hover:text-red-500 transition-colors" />
                </div>

                {/* Botão Sair (Discreto/Invisible ou Absolute Top Right) */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-white/20 hover:text-white/80 hover:bg-white/10"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </Button>

                {/* Botões de Seleção (Integrados ou Flutuantes?) */}
                {/* User complained about "Exit" button. I'll hide selection buttons unless in selection mode? */}
                {/* Moving Selection Logic to floated absolute Left or keeping invisible until needed? */}
                {/* I'll keep them absolute Left for now, similar to PWA logic if possible, or minimally intrusive */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {!selectionMode ? (
                        <Button
                            onClick={onToggleSelectionMode}
                            variant="ghost"
                            className="text-blue-300 hover:text-white hover:bg-white/10 text-[10px] uppercase font-bold tracking-wider h-8"
                        >
                            Modo Seleção
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 bg-blue-900/80 p-1 rounded border border-blue-700">
                            <Button onClick={onBatchEdit} className="bg-green-600 h-6 text-[10px] px-2">Editar ({selectedCells.length})</Button>
                            <Button onClick={onToggleSelectionMode} variant="destructive" className="h-6 text-[10px] px-2">Sair</Button>
                        </div>
                    )}
                </div>
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
                                            <div key={idx}
                                                className="text-white text-[9px] font-bold px-1 py-0.5 rounded mb-1 text-center truncate shadow-sm"
                                                style={{ backgroundColor: ev.color || '#000000' }}
                                            >
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
                            // Sort by Display Order (Primary) then Name (Secondary)
                            .sort((a, b) => {
                                const orderA = a.displayOrder ?? 9999;
                                const orderB = b.displayOrder ?? 9999;
                                if (orderA !== orderB) return orderA - orderB;
                                return a.name.localeCompare(b.name);
                            })
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
                                            <td
                                                key={day}
                                                className="border border-gray-200 p-0 h-[50px] align-middle hover:bg-blue-50 transition-colors relative cursor-pointer active:bg-blue-100"
                                                onClick={() => onCellClick(employee.id, dateStr)}
                                            >
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
