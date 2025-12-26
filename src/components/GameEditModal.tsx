
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Plus, Trash2, Calendar } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';

interface GameEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

interface EventInfo {
  id: string;
  name: string;
  time: string;
  type: string;
  color: string;
}

const GameEditModal: React.FC<GameEditModalProps> = ({
  isOpen,
  onClose,
  date
}) => {
  const { scheduleData, addEvent, updateEvent, deleteEvent } = useSchedule();
  const [events, setEvents] = useState<EventInfo[]>([]);

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('pt-BR');

  useEffect(() => {
    if (isOpen && date) {
      console.log('GameEditModal: Opening for date:', date);

      const eventsForDate = scheduleData.settings.events.filter(e => e.date === date);

      if (eventsForDate.length > 0) {
        setEvents(eventsForDate.map(e => ({
          id: e.id,
          name: e.name,
          time: e.time,
          type: e.type || 'common',
          color: e.color || '#000000'
        })));
      } else {
        setEvents([{ id: 'new', name: '', time: '', type: 'common', color: '#000000' }]);
      }
    }
  }, [isOpen, date, scheduleData.settings.events]);

  const addNewEvent = () => {
    setEvents([...events, { id: `new-${Date.now()}`, name: '', time: '', type: 'common', color: '#000000' }]);
  };

  const removeEvent = (index: number) => {
    const eventToRemove = events[index];
    if (eventToRemove.id !== 'new' && !eventToRemove.id.startsWith('new-')) {
      deleteEvent(eventToRemove.id);
    }
    setEvents(events.filter((_, i) => i !== index));
  };

  const updateEventInfo = (index: number, field: keyof EventInfo, value: string) => {
    const updatedEvents = events.map((event, i) => {
      if (i === index) {
        return { ...event, [field]: value };
      }
      return event;
    });
    setEvents(updatedEvents);
  };

  const handleSave = () => {
    const validEvents = events.filter(event => event.name.trim() !== '');

    validEvents.forEach(event => {
      const eventPayload = {
        name: event.name,
        date: date,
        time: event.time || '',
        description: event.time ? `${event.name} - ${event.time}` : event.name,
        type: event.type as any,
        color: event.color
      };

      if (event.id === 'new' || event.id.startsWith('new-')) {
        addEvent(eventPayload);
      } else {
        updateEvent(event.id, eventPayload);
      }
    });

    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="max-w-md z-[200]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Eventos - {formattedDate}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={index} className="space-y-3 p-3 border border-gray-100 rounded-lg bg-gray-50/50">

                {/* Type Selection */}
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">Tipo de Evento</Label>
                  <Select value={event.type} onValueChange={(val) => updateEventInfo(index, 'type', val)}>
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="common">Evento Comum</SelectItem>
                      <SelectItem value="national_holiday">Feriado Nacional</SelectItem>
                      <SelectItem value="optional_holiday">Feriado Facultativo</SelectItem>
                      <SelectItem value="company_event">Evento da Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Name */}
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">Nome do Evento</Label>
                  <Input
                    value={event.name}
                    onChange={(e) => updateEventInfo(index, 'name', e.target.value)}
                    placeholder="Ex: GUARANI X PONTE PRETA"
                    className="h-9 bg-white"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Evento geral, reunião, treinamento, etc.</p>
                </div>

                {/* Time & Color Row */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs font-semibold text-gray-700 mb-1 block">Horário (opcional)</Label>
                    <Input
                      type="time"
                      value={event.time}
                      onChange={(e) => updateEventInfo(index, 'time', e.target.value)}
                      className="h-9 bg-white"
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs font-semibold text-gray-700 mb-1 block">Cor</Label>
                    <div className="flex items-center gap-2">
                      <div className="relative w-full h-9 rounded-md border border-gray-300 overflow-hidden cursor-pointer shadow-sm">
                        <input
                          type="color"
                          value={event.color}
                          onChange={(e) => updateEventInfo(index, 'color', e.target.value)}
                          className="absolute -top-2 -left-2 w-[200%] h-[200%] cursor-pointer p-0 border-0"
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">{event.color}</span>
                    </div>
                  </div>
                </div>

                {/* Remove Button (if multiple or existing) */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEvent(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remover Evento
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addNewEvent}
            className="w-full flex items-center gap-2 h-10 border-dashed border-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Outro Evento
          </Button>

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>

            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameEditModal;
