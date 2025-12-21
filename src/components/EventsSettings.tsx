
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { formatDate } from 'date-fns';

const EventsSettings = () => {
  const { scheduleData, addEvent, updateEvent, deleteEvent } = useSchedule();
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    description: ''
  });

  const handleAddEvent = () => {
    if (newEvent.name && newEvent.date) {
      addEvent({
        name: newEvent.name,
        date: newEvent.date,
        time: newEvent.time || '', // Horário opcional
        description: newEvent.time ? `${newEvent.name} - ${newEvent.time}` : newEvent.name
      });
      setNewEvent({
        name: '',
        date: '',
        time: '',
        description: ''
      });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      deleteEvent(eventId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="neuro-outset-sm p-3 rounded-2xl">
          <Calendar className="h-6 w-6 text-neuro-accent" />
        </div>
        <h2 className="text-2xl font-bold text-neuro-text-primary">Gerenciar Eventos</h2>
      </div>

      {/* Adicionar novo evento */}
      <div className="neuro-inset p-6 rounded-2xl bg-neuro-surface">
        <h3 className="text-lg font-semibold text-neuro-text-primary mb-4">Adicionar Novo Evento</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="event-name" className="text-neuro-text-primary">Nome do Evento</Label>
            <Input
              id="event-name"
              value={newEvent.name}
              onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Bugre x CSA"
              className="neuro-input bg-neuro-element text-neuro-text-primary"
            />
          </div>
          <div>
            <Label htmlFor="event-date" className="text-neuro-text-primary">Data</Label>
            <Input
              id="event-date"
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
              className="neuro-input bg-neuro-element text-neuro-text-primary"
            />
          </div>
          <div>
            <Label htmlFor="event-time" className="text-neuro-text-primary">Horário (opcional)</Label>
            <Input
              id="event-time"
              type="time"
              value={newEvent.time}
              onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
              className="neuro-input bg-neuro-element text-neuro-text-primary"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddEvent} className="w-full neuro-button text-neuro-text-primary">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de eventos */}
      {scheduleData.settings.events.length > 0 && (
        <div className="neuro-inset p-6 rounded-2xl bg-neuro-surface">
          <h3 className="text-lg font-semibold text-neuro-text-primary mb-4">Eventos Cadastrados</h3>
          <div className="space-y-3">
            {scheduleData.settings.events.map((event) => (
              <div key={event.id} className="neuro-outset-sm p-4 rounded-xl bg-neuro-element flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neuro-text-primary">{event.name}</div>
                  <div className="text-sm text-neuro-text-secondary">
                    {new Date(event.date).toLocaleDateString('pt-BR')}
                    {event.time && ` às ${event.time}`}
                  </div>
                  {event.description && (
                    <div className="text-xs text-neuro-text-muted mt-1">{event.description}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="neuro-button bg-neuro-error text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {scheduleData.settings.events.length === 0 && (
        <div className="neuro-inset p-8 rounded-2xl bg-neuro-surface text-center">
          <Calendar className="h-12 w-12 text-neuro-text-muted mx-auto mb-4" />
          <p className="text-neuro-text-secondary">Nenhum evento cadastrado ainda.</p>
          <p className="text-sm text-neuro-text-muted mt-1">
            Adicione eventos como jogos, feriados ou outros eventos importantes.
          </p>
        </div>
      )}
    </div>
  );
};

export default EventsSettings;
