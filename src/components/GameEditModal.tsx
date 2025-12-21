
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      console.log('GameEditModal: All events:', scheduleData.settings.events);
      
      const eventsForDate = scheduleData.settings.events.filter(e => e.date === date);
      console.log('GameEditModal: Events for date:', eventsForDate);
      
      if (eventsForDate.length > 0) {
        setEvents(eventsForDate.map(e => ({ id: e.id, name: e.name, time: e.time })));
      } else {
        setEvents([{ id: 'new', name: '', time: '' }]);
      }
    }
  }, [isOpen, date, scheduleData.settings.events]);

  const addNewEvent = () => {
    setEvents([...events, { id: `new-${Date.now()}`, name: '', time: '' }]);
  };

  const removeEvent = (index: number) => {
    const eventToRemove = events[index];
    if (eventToRemove.id !== 'new' && !eventToRemove.id.startsWith('new-')) {
      console.log('GameEditModal: Deleting event:', eventToRemove.id);
      deleteEvent(eventToRemove.id);
    }
    setEvents(events.filter((_, i) => i !== index));
  };

  const updateEventInfo = (index: number, field: 'name' | 'time', value: string) => {
    const updatedEvents = events.map((event, i) => {
      if (i === index) {
        return { ...event, [field]: value };
      }
      return event;
    });
    setEvents(updatedEvents);
  };

  const handleSave = () => {
    console.log('GameEditModal: Saving events for date:', date);
    console.log('GameEditModal: Events to save:', events);
    
    // Remove eventos vazios (apenas o nome é obrigatório, horário é opcional)
    const validEvents = events.filter(event => event.name.trim() !== '');
    console.log('GameEditModal: Valid events:', validEvents);
    
    validEvents.forEach(event => {
      if (event.id === 'new' || event.id.startsWith('new-')) {
        // Adicionar novo evento
        console.log('GameEditModal: Adding new event:', event);
        addEvent({
          name: event.name,
          date: date,
          time: event.time || '', // Horário é opcional
          description: event.time ? `${event.name} - ${event.time}` : event.name
        });
      } else {
        // Atualizar evento existente
        console.log('GameEditModal: Updating event:', event.id, event);
        updateEvent(event.id, {
          name: event.name,
          time: event.time || '', // Horário é opcional
          description: event.time ? `${event.name} - ${event.time}` : event.name
        });
      }
    });

    onClose();
  };

  const handleClose = () => {
    console.log('GameEditModal: Closing modal');
    onClose();
  };

  if (!date) {
    console.log('GameEditModal: No date provided');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('GameEditModal: Dialog onOpenChange called with:', open);
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Eventos - {formattedDate}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Nome do Evento</Label>
                  <Input
                    value={event.name}
                    onChange={(e) => updateEventInfo(index, 'name', e.target.value)}
                    placeholder="Ex: GUARANI X PONTE PRETA"
                    className="text-sm"
                  />
                </div>
                <div className="w-20">
                  <Label className="text-xs">Horário (opcional)</Label>
                  <Input
                    type="time"
                    value={event.time}
                    onChange={(e) => updateEventInfo(index, 'time', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeEvent(index)}
                  className="text-red-600 hover:text-red-700 h-9"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addNewEvent}
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Outro Evento
          </Button>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
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
