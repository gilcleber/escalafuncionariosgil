import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, Clock, Calendar, Users, Copy, Plus, Trash2 } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { Shift, Employee } from '@/types/employee';

interface ShiftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  date: string;
  existingShift?: Shift;
  batchTargets?: { employeeId: string; date: string }[];
}

interface ShiftInfo {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
}

const ShiftEditModal: React.FC<ShiftEditModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  date,
  existingShift,
  batchTargets
}) => {
  const { scheduleData, addShift, updateShift, deleteShift } = useSchedule();
  const [shiftType, setShiftType] = useState<'work' | 'dayoff' | 'homeoffice' | 'event' | 'birthday' | 'breastfeeding' | 'medical' | 'external' | 'suspension' | 'paternity' | 'blood_donation' | 'military' | 'marriage' | 'public_service' | 'family_death' | 'deduct_day' | 'vacation'>('work');
  const [shifts, setShifts] = useState<ShiftInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [copyToNextDays, setCopyToNextDays] = useState(false);
  const [daysToApply, setDaysToApply] = useState(5);
  const [vacationDays, setVacationDays] = useState(1);

  const employee = scheduleData.employees.find(e => e.id === employeeId);
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('pt-BR');

  const shiftTypeOptions = [
    { value: 'work', label: 'Trabalho' },
    { value: 'dayoff', label: 'Folga' },
    { value: 'homeoffice', label: 'Trabalho Remoto' },
    { value: 'event', label: 'Evento/Jogo' },
    { value: 'birthday', label: 'Aniversário' },
    { value: 'breastfeeding', label: 'Amamentação' },
    { value: 'medical', label: 'Atestado Médico' },
    { value: 'external', label: 'Serviço Externo' },
    { value: 'suspension', label: 'Suspensão' },
    { value: 'paternity', label: 'Licença Paternidade' },
    { value: 'blood_donation', label: 'Doação de Sangue' },
    { value: 'military', label: 'Afastamento Militar' },
    { value: 'marriage', label: 'Licença Casamento' },
    { value: 'public_service', label: 'Convocação de Órgãos Públicos' },
    { value: 'family_death', label: 'Falecimento Familiar' },
    { value: 'deduct_day', label: 'Descontar Dia' },
    { value: 'vacation', label: 'Férias' }
  ];

  useEffect(() => {
    if (isOpen && date) {
      console.log('ShiftEditModal: Opening for employee:', employeeId, 'date:', date);

      const shiftsForDate = scheduleData.shifts.filter(s => s.employeeId === employeeId && s.date === date);
      console.log('ShiftEditModal: Shifts for date:', shiftsForDate);

      if (shiftsForDate.length > 0) {
        const shiftInfos = shiftsForDate.map(s => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          description: s.description || ''
        }));
        setShifts(shiftInfos);
        setShiftType(shiftsForDate[0].type === 'holiday' ? 'homeoffice' : shiftsForDate[0].type as any);
      } else {
        setShifts([{ id: 'new', startTime: '', endTime: '', description: '' }]);
        setShiftType('work');
      }
    }
  }, [isOpen, date, employeeId, scheduleData.shifts]);

  const addNewShift = () => {
    setShifts([...shifts, { id: `new-${Date.now()}`, startTime: '', endTime: '', description: '' }]);
  };

  const removeShift = (index: number) => {
    const shiftToRemove = shifts[index];
    if (shiftToRemove.id !== 'new' && !shiftToRemove.id.startsWith('new-')) {
      console.log('ShiftEditModal: Deleting shift:', shiftToRemove.id);
      deleteShift(shiftToRemove.id);
    }
    setShifts(shifts.filter((_, i) => i !== index));
  };

  const updateShiftInfo = (index: number, field: 'startTime' | 'endTime' | 'description', value: string) => {
    const updatedShifts = shifts.map((shift, i) => {
      if (i === index) {
        return { ...shift, [field]: value };
      }
      return shift;
    });
    setShifts(updatedShifts);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = scheduleData.settings.shiftTemplates.find(t => t.id === templateId);
    if (template && shifts.length > 0) {
      updateShiftInfo(0, 'startTime', template.startTime);
      updateShiftInfo(0, 'endTime', template.endTime);
      setSelectedTemplate(templateId);
    }
  };

  const handleEventSelect = (eventId: string) => {
    const event = scheduleData.settings.events.find(e => e.id === eventId);
    if (event && shifts.length > 0) {
      updateShiftInfo(0, 'description', `${event.name} - ${event.time}`);
      setSelectedEvent(eventId);
    }
  };

  const getNextEmptyDays = (maxDays: number = 10) => {
    const currentDate = new Date(date);
    const emptyDays = [];

    for (let i = 1; i <= maxDays; i++) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + i);

      if (nextDate.getMonth() !== currentDate.getMonth()) break;

      const nextDateString = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}-${nextDate.getDate().toString().padStart(2, '0')}`;
      const existingShift = scheduleData.shifts.find(s => s.employeeId === employeeId && s.date === nextDateString);

      if (!existingShift) {
        emptyDays.push(nextDateString);
      } else {
        break;
      }
    }

    return emptyDays;
  };

  const getConsecutiveDaysForVacation = (days: number) => {
    const currentDate = new Date(date);
    const vacationDates = [date];

    for (let i = 1; i < days; i++) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + i);

      const nextDateString = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}-${nextDate.getDate().toString().padStart(2, '0')}`;
      vacationDates.push(nextDateString);
    }

    return vacationDates;
  };

  const handleSave = () => {
    // Determine Target List
    const targets = (batchTargets && batchTargets.length > 0)
      ? batchTargets
      : [{ employeeId, date }];

    console.log(`ShiftEditModal: Saving ${targets.length} targets.`);
    // If batch mode, we only support single shift editing for now (first item in shifts array)
    // or we check the primary inputs. Since the UI for batch allows 1 set of inputs (Work, Start, End, Desc).
    // usage of 'shifts' array state is for the dynamic list, but typically batch edit uses the first/main one.

    // User Requirement: "If field is empty, do NOT overwrite existing"
    const inputShift = shifts[0] || { startTime: '', endTime: '', description: '' };
    const inputType = shiftType;

    targets.forEach(target => {
      const tEmpId = target.employeeId;
      const tDate = target.date;

      // Vacation Logic: Special Case
      if (shiftType === 'vacation') {
        // ... (Keep existing vacation logic or simplify for batch?)
        // Vacation usually implies a "Start Date" and "Duration". 
        // Applying to a batch of random cells is weird. 
        // Standard behavior: Apply "Vacation" status to THESE specific cells.

        // If the user selected 5 loose days and clicked "Vacation" -> Set them all to Vacation.
        // Ignore "duration" calc for batch mode?
        // "getConsecutiveDays" logic is likely for "Start from this day".

        if (batchTargets && batchTargets.length > 0) {
          // Batch Mode: Apply vacation to SELECTED cells only
          // Check if existing
          const existing = scheduleData.shifts.find(s => s.employeeId === tEmpId && s.date === tDate);
          if (existing) deleteShift(existing.id);

          addShift({
            employeeId: tEmpId,
            date: tDate,
            startTime: '', endTime: '',
            type: 'vacation',
            description: 'Férias'
          });
        } else {
          // Single Mode: Use the consecutive days logic
          const vacationDates = getConsecutiveDaysForVacation(vacationDays);
          vacationDates.forEach((vacationDate, index) => {
            const existingVacationShift = scheduleData.shifts.find(s => s.employeeId === tEmpId && s.date === vacationDate);
            if (existingVacationShift) updateShift(existingVacationShift.id, { type: 'vacation', description: `Férias` });
            else addShift({ employeeId: tEmpId, date: vacationDate, startTime: '', endTime: '', type: 'vacation', description: `Férias` });
          });
        }

      } else {
        // Standard Shift Logic (Work, DayOff, HomeOffice, etc)

        // 1. Find Existing
        const existing = scheduleData.shifts.find(s => s.employeeId === tEmpId && s.date === tDate);

        // 2. Resolve Values (Smart Merge)
        // If Input is Empty -> Keep Existing (if types are compatible)
        // If Type Changed -> Logic varies. 
        //    - If changing to Work -> Need times. If input empty & existing was Work, keep times. Else ???
        //    - If changing to DayOff -> Clear times.

        let finalStart = inputShift.startTime;
        let finalEnd = inputShift.endTime;
        let finalDesc = inputShift.description;

        if (existing) {
          // If input is empty, preserve existing
          if (!finalStart && existing.startTime) finalStart = existing.startTime;
          if (!finalEnd && existing.endTime) finalEnd = existing.endTime;
          if (!finalDesc && existing.description) finalDesc = existing.description;

          // EXCEPT: If changing Type to something that doesn't use time (e.g. DayOff), clear times?
          // User said: "If I leave blank, don't overwrite". 
          // But if I change to Folga, keeping "08:00" is dirty.
          // Let's assume: If Type is WORK/HOMEOFFICE, preserve times. If Type is FOLGA, ignore times.

          if (inputType !== 'work' && inputType !== 'homeoffice') {
            finalStart = '';
            finalEnd = '';
          }

          // Delete old (to replace with new clean one, or just update?)
          // Update is safer for IDs but standard pattern here is delete/add or update.
          deleteShift(existing.id);
        }

        // 3. Add New
        // Only add if it's a valid shift type or has times if required
        // Actually, just add it.

        addShift({
          employeeId: tEmpId,
          date: tDate,
          startTime: finalStart || '',
          endTime: finalEnd || '',
          type: inputType === 'homeoffice' ? 'holiday' : inputType, // Map homeoffice logic? Or keep type? Original code mapped to holiday??
          // Wait, original code: const finalShiftType = shiftType === 'homeoffice' ? 'holiday' : shiftType;
          // I will keep that logic.
          description: finalDesc || ''
        });
      }
    });

    onClose();
  };

  const handleDelete = () => {
    const shiftsToDelete = scheduleData.shifts.filter(s => s.employeeId === employeeId && s.date === date);
    shiftsToDelete.forEach(shift => {
      deleteShift(shift.id);
    });
    onClose();
  };

  const isHoliday = scheduleData.settings.holidays.some(h => h.date === date);
  const eventForDate = scheduleData.settings.events.find(e => e.date === date);
  const emptyDaysCount = getNextEmptyDays().length;
  const hasExistingShifts = scheduleData.shifts.some(s => s.employeeId === employeeId && s.date === date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full max-h-[85vh] overflow-y-auto neuro-card bg-neuro-surface border-none shadow-none mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-neuro-text-primary">
            <Users className="h-5 w-5 text-neuro-accent" />
            {batchTargets && batchTargets.length > 0
              ? `Editar ${batchTargets.length} Itens em Lote`
              : `Editar Turno - ${employee?.name}`
            }
          </DialogTitle>
          <p className="text-sm text-neuro-text-secondary">{formattedDate}</p>
        </DialogHeader>

        <div className="space-y-4 px-1">
          {/* Holiday/Event Alerts */}
          {isHoliday && (
            <div className="neuro-inset p-3 bg-neuro-error/10 rounded-2xl">
              <p className="text-sm text-neuro-error font-medium">
                🎄 Este dia é feriado nacional
              </p>
            </div>
          )}

          {eventForDate && (
            <div className="neuro-inset p-3 bg-neuro-success/10 rounded-2xl">
              <p className="text-sm text-neuro-success font-medium">
                🏈 Evento: {eventForDate.name} às {eventForDate.time}
              </p>
            </div>
          )}

          {/* Copy to next days option */}
          {!hasExistingShifts && emptyDaysCount > 0 && shiftType !== 'vacation' && (!batchTargets || batchTargets.length === 0) && (
            <div className="neuro-inset p-3 bg-neuro-accent/10 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={copyToNextDays}
                  onChange={(e) => setCopyToNextDays(e.target.checked)}
                  className="neuro-input w-4 h-4"
                />
                <Label className="text-sm text-neuro-text-primary font-medium">
                  <Copy className="h-3 w-3 inline mr-1" />
                  Aplicar para próximos dias vazios
                </Label>
              </div>
              {copyToNextDays && (
                <div className="flex items-center space-x-2">
                  <Label className="text-xs text-neuro-text-secondary">Quantidade de dias:</Label>
                  <Input
                    type="number"
                    min="1"
                    max={Math.min(emptyDaysCount, 15)}
                    value={daysToApply}
                    onChange={(e) => setDaysToApply(Number(e.target.value))}
                    className="neuro-input w-16 h-7 text-xs"
                  />
                  <span className="text-xs text-neuro-text-muted">
                    (máx. {Math.min(emptyDaysCount, 15)})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Shift Type */}
          <div>
            <Label className="text-neuro-text-primary font-semibold mb-2 block">Tipo de Turno</Label>
            <Select value={shiftType} onValueChange={(value: any) => setShiftType(value)}>
              <SelectTrigger className="neuro-inset bg-neuro-element text-neuro-text-primary border-none rounded-2xl h-12 focus:ring-2 focus:ring-neuro-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="neuro-card bg-neuro-surface border-none rounded-2xl z-50">
                {shiftTypeOptions.map(option => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-neuro-text-primary hover:bg-neuro-element rounded-xl my-1 mx-2 focus:bg-neuro-accent/20"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vacation Days Input */}
          {shiftType === 'vacation' && (
            <div>
              <Label className="text-neuro-text-primary font-semibold mb-2 block">Quantidade de Dias de Férias</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={vacationDays}
                onChange={(e) => setVacationDays(Number(e.target.value))}
                placeholder="Ex: 7, 15, 30..."
                className="neuro-inset bg-neuro-element text-neuro-text-primary border-none rounded-2xl h-12"
              />
              <p className="text-xs text-neuro-text-muted mt-1">
                Será aplicado automaticamente para {vacationDays} dias consecutivos a partir de {formattedDate}
              </p>
            </div>
          )}

          {/* Event Selection for Event type */}
          {shiftType === 'event' && (
            <div>
              <Label className="text-neuro-text-primary font-semibold mb-2 block">Selecionar Evento</Label>
              <Select value={selectedEvent} onValueChange={handleEventSelect}>
                <SelectTrigger className="neuro-inset bg-neuro-element text-neuro-text-primary border-none rounded-2xl h-12 focus:ring-2 focus:ring-neuro-accent">
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent className="neuro-card bg-neuro-surface border-none rounded-2xl z-50">
                  {scheduleData.settings.events.map(event => (
                    <SelectItem
                      key={event.id}
                      value={event.id}
                      className="text-neuro-text-primary hover:bg-neuro-element rounded-xl my-1 mx-2 focus:bg-neuro-accent/20"
                    >
                      {event.name} - {event.time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Template Selection for Work */}
          {(shiftType === 'work' || shiftType === 'homeoffice') && (
            <div>
              <Label className="text-neuro-text-primary font-semibold mb-2 block">Modelo de Turno (Opcional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="neuro-inset bg-neuro-element text-neuro-text-primary border-none rounded-2xl h-12 focus:ring-2 focus:ring-neuro-accent">
                  <SelectValue placeholder="Selecione um modelo ou digite manualmente" />
                </SelectTrigger>
                <SelectContent className="neuro-card bg-neuro-surface border-none rounded-2xl z-50">
                  {scheduleData.settings.shiftTemplates.map(template => (
                    <SelectItem
                      key={template.id}
                      value={template.id}
                      className="text-neuro-text-primary hover:bg-neuro-element rounded-xl my-1 mx-2 focus:bg-neuro-accent/20"
                    >
                      {template.name} ({template.startTime} - {template.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Multiple Shifts for Work/Remote Work */}
          {(shiftType === 'work' || shiftType === 'homeoffice') && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-neuro-text-primary">Horários de Trabalho</Label>
              {shifts.map((shift, index) => (
                <div key={index} className="neuro-inset bg-neuro-element rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-neuro-text-primary">Horário {index + 1}</Label>
                    {shifts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeShift(index)}
                        className="text-neuro-error hover:text-neuro-error h-6 w-6 p-0 neuro-button"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-neuro-text-primary font-medium mb-1 block">Hora Início</Label>
                      <Input
                        type="time"
                        value={shift.startTime}
                        onChange={(e) => updateShiftInfo(index, 'startTime', e.target.value)}
                        className="neuro-inset bg-neuro-surface text-neuro-text-primary text-sm border-none rounded-xl h-10"
                        placeholder="Ex: 07:00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-neuro-text-primary font-medium mb-1 block">Hora Fim</Label>
                      <Input
                        type="time"
                        value={shift.endTime}
                        onChange={(e) => updateShiftInfo(index, 'endTime', e.target.value)}
                        className="neuro-inset bg-neuro-surface text-neuro-text-primary text-sm border-none rounded-xl h-10"
                        placeholder="Ex: 13:00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-neuro-text-primary font-medium mb-1 block">Descrição (opcional)</Label>
                    <Input
                      value={shift.description}
                      onChange={(e) => updateShiftInfo(index, 'description', e.target.value)}
                      placeholder="Ex: Locutor manhã, Operador técnico..."
                      className="neuro-inset bg-neuro-surface text-neuro-text-primary text-sm border-none rounded-xl h-10"
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addNewShift}
                className="w-full flex items-center gap-2 neuro-button h-12"
              >
                <Plus className="h-4 w-4" />
                Adicionar Outro Horário
              </Button>

              <p className="text-xs text-neuro-text-muted">
                * Digite exatamente os horários que deseja. Não há preenchimento automático.
              </p>
            </div>
          )}

          {/* Description for other types */}
          {(shiftType === 'event' || shiftType === 'medical' || shiftType === 'external' ||
            shiftType === 'suspension' || shiftType === 'paternity' || shiftType === 'military' ||
            shiftType === 'marriage' || shiftType === 'public_service' || shiftType === 'family_death') && (
              <div>
                <Label className="text-neuro-text-primary font-semibold mb-2 block">Descrição</Label>
                <Textarea
                  value={shifts[0]?.description || ''}
                  onChange={(e) => updateShiftInfo(0, 'description', e.target.value)}
                  placeholder="Descrição ou observações adicionais"
                  rows={3}
                  className="neuro-inset bg-neuro-element text-neuro-text-primary border-none rounded-2xl resize-none"
                />
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose} className="neuro-button">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>

            {hasExistingShifts && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="neuro-button text-neuro-error hover:bg-neuro-error/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            )}

            <Button onClick={handleSave} className="neuro-button bg-neuro-accent text-white hover:bg-neuro-accent-light">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftEditModal;
