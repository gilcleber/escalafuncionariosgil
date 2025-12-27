import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, Clock, Calendar, Users, Copy, Plus, Trash2, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { Shift, Employee } from '@/types/employee';
import { validateNewShift } from '@/utils/workRules';

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
  // Include 'network_program' in the state type definition. Valid types + UI-only abstraction 'homeoffice'
  const [shiftType, setShiftType] = useState<Shift['type'] | 'homeoffice'>('work');
  const [shifts, setShifts] = useState<ShiftInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [copyToNextDays, setCopyToNextDays] = useState(false);
  const [daysToApply, setDaysToApply] = useState(5);
  const [vacationDays, setVacationDays] = useState(1);

  // New States for Manager Override and Validation
  const [managerOverride, setManagerOverride] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const employee = scheduleData.employees.find(e => e.id === employeeId);
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('pt-BR');

  const shiftTypeOptions = [
    { value: 'work', label: 'Trabalho' },
    { value: 'dayoff', label: 'Folga' },
    { value: 'holiday', label: 'Feriado' }, // Added explicit Holiday option if needed, usually mapped from system
    { value: 'homeoffice', label: 'Trabalho Remoto' },
    { value: 'network_program', label: 'Programação em Rede' }, // New Option
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

      if (shiftsForDate.length > 0) {
        const shiftInfos = shiftsForDate.map(s => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          description: s.description || ''
        }));
        setShifts(shiftInfos);
        setShiftType(shiftsForDate[0].type);
        setManagerOverride(shiftsForDate[0].managerOverride || false); // Load existing override
      } else {
        setShifts([{ id: 'new', startTime: '', endTime: '', description: '' }]);
        setShiftType('work');
        setManagerOverride(false);
      }
    }
  }, [isOpen, date, employeeId, scheduleData.shifts]);

  // Real-time Validation Effect
  useEffect(() => {
    if (shiftType === 'work' || shiftType === 'homeoffice' || shiftType === 'network_program') {
      const firstShift = shifts[0] || { startTime: '08:00', endTime: '17:00' }; // Default for validation check if empty
      const violations = validateNewShift({
        employeeId,
        date,
        startTime: firstShift.startTime || '08:00',
        endTime: firstShift.endTime || '17:00' // Assume full day if time not set yet to catch day-based rules
      }, scheduleData.shifts);
      setValidationErrors(violations);
    } else {
      setValidationErrors([]);
    }
  }, [shiftType, shifts, employeeId, date, scheduleData.shifts]);


  const addNewShift = () => {
    setShifts([...shifts, { id: `new-${Date.now()}`, startTime: '', endTime: '', description: '' }]);
  };

  const removeShift = (index: number) => {
    const shiftToRemove = shifts[index];
    if (shiftToRemove.id !== 'new' && !shiftToRemove.id.startsWith('new-')) {
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
    const targets = (batchTargets && batchTargets.length > 0)
      ? batchTargets
      : [{ employeeId, date }];

    const inputShift = shifts[0] || { startTime: '', endTime: '', description: '' };
    const inputType = shiftType;

    targets.forEach(target => {
      const tEmpId = target.employeeId;
      const tDate = target.date;

      if (shiftType === 'vacation') {
        if (batchTargets && batchTargets.length > 0) {
          const existing = scheduleData.shifts.find(s => s.employeeId === tEmpId && s.date === tDate);
          if (existing) deleteShift(existing.id);

          addShift({
            employeeId: tEmpId,
            date: tDate,
            startTime: '', endTime: '',
            type: 'vacation',
            description: 'Férias',
            managerOverride // Persist override
          });
        } else {
          const vacationDates = getConsecutiveDaysForVacation(vacationDays);
          vacationDates.forEach((vacationDate) => {
            const existingVacationShift = scheduleData.shifts.find(s => s.employeeId === tEmpId && s.date === vacationDate);
            if (existingVacationShift) updateShift(existingVacationShift.id, { type: 'vacation', description: `Férias`, managerOverride });
            else addShift({ employeeId: tEmpId, date: vacationDate, startTime: '', endTime: '', type: 'vacation', description: `Férias`, managerOverride });
          });
        }

      } else {
        const existing = scheduleData.shifts.find(s => s.employeeId === tEmpId && s.date === tDate);

        let finalStart = inputShift.startTime;
        let finalEnd = inputShift.endTime;
        let finalDesc = inputShift.description;

        if (existing) {
          if (!finalStart && existing.startTime) finalStart = existing.startTime;
          if (!finalEnd && existing.endTime) finalEnd = existing.endTime;
          if (!finalDesc && existing.description) finalDesc = existing.description;

          if (inputType !== 'work' && inputType !== 'homeoffice' && inputType !== 'network_program') {
            finalStart = '';
            finalEnd = '';
          }
          deleteShift(existing.id);
        }

        addShift({
          employeeId: tEmpId,
          date: tDate,
          startTime: finalStart || '',
          endTime: finalEnd || '',
          type: inputType === 'homeoffice' ? 'holiday' : inputType,
          description: finalDesc || '',
          managerOverride // Persist override
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

  // Validation UI logic
  const hasErrors = validationErrors.length > 0;
  // If we have errors but validated by manager, we behave as "Success/Warning" instead of "Error"
  const isBlocked = hasErrors && !managerOverride;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full max-h-[85vh] overflow-y-auto neuro-card bg-neuro-surface border-none shadow-none mx-4 z-[200]">
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

          {/* Validation Errors Banner */}
          {hasErrors && (
            <div className={`neuro-inset p-4 rounded-2xl border-2 ${managerOverride ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} animate-in fade-in`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 shrink-0 ${managerOverride ? 'text-yellow-600' : 'text-red-600'}`} />
                <div>
                  <h4 className={`font-bold text-sm ${managerOverride ? 'text-yellow-800' : 'text-red-800'}`}>
                    {managerOverride ? 'Alertas Ignorados pelo Gestor' : 'Regras de Trabalho Violadas'}
                  </h4>
                  <ul className="mt-1 space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className={`text-xs ${managerOverride ? 'text-yellow-700' : 'text-red-700'}`}>
                        • {err.replace('BLOQUEADO:', '')}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Shift Type */}
          <div>
            <Label className="text-neuro-text-primary font-semibold mb-2 block">Tipo de Turno</Label>
            <Select value={shiftType} onValueChange={(value: any) => setShiftType(value)}>
              <SelectTrigger className="neuro-inset bg-neuro-element text-neuro-text-primary border-none rounded-2xl h-12 focus:ring-2 focus:ring-neuro-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="neuro-card bg-neuro-surface border-none rounded-2xl z-[250]">
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

          {/* Manager Override Checkbox */}
          <div
            className={`neuro-inset p-4 rounded-2xl transition-all cursor-pointer border ${managerOverride ? 'bg-orange-50 border-orange-200' : 'bg-neuro-element border-transparent'}`}
            onClick={() => setManagerOverride(!managerOverride)}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${managerOverride ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}>
                {managerOverride ? <Unlock className="h-3 w-3 text-white" /> : <Lock className="h-3 w-3 text-gray-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className={`font-bold cursor-pointer ${managerOverride ? 'text-orange-800' : 'text-gray-700'}`}>
                    Liberado pelo Gestor
                  </Label>
                  {managerOverride && <span className="text-[10px] bg-orange-200 text-orange-800 px-1.5 rounded-full font-bold">ATIVO</span>}
                </div>
                <p className={`text-xs mt-1 ${managerOverride ? 'text-orange-700' : 'text-gray-500'}`}>
                  Marque para ignorar alertas de regras (7 dias seguidos, interjornada, domingos, etc.) e forçar o salvamento.
                </p>
              </div>
            </div>
          </div>

          {/* Copy to next days (Existing logic but conditional rendering) */}
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
                <SelectContent className="neuro-card bg-neuro-surface border-none rounded-2xl z-[250]">
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
          {(shiftType === 'work' || shiftType === 'homeoffice' || shiftType === 'network_program') && (
            <div>
              <Label className="text-neuro-text-primary font-semibold mb-2 block">Modelo de Turno (Opcional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="neuro-inset bg-neuro-element text-neuro-text-primary border-none rounded-2xl h-12 focus:ring-2 focus:ring-neuro-accent">
                  <SelectValue placeholder="Selecione um modelo ou digite manualmente" />
                </SelectTrigger>
                <SelectContent className="neuro-card bg-neuro-surface border-none rounded-2xl z-[250]">
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
          {(shiftType === 'work' || shiftType === 'homeoffice' || shiftType === 'network_program') && (
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

            <Button
              onClick={handleSave}
              disabled={isBlocked}
              className={`neuro-button text-white ${isBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-neuro-accent hover:bg-neuro-accent-light'}`}
            >
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
