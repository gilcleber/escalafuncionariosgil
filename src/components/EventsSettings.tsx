import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { cn } from '@/lib/utils';
import { Event } from '@/types/employee';

const COLOR_PALETTE = [
  '#E2E8F0', // Gray (Default)
  '#DBEAFE', // Blue
  '#DCFCE7', // Green
  '#FEF3C7', // Yellow
  '#FFEDD5', // Orange
  '#FAE8FF', // Purple
  '#FCE7F3', // Pink
  '#FEE2E2', // Red
];

const EVENT_TYPES = [
  { value: 'common', label: 'Evento Comum' },
  { value: 'national_holiday', label: 'Feriado Nacional' },
  { value: 'optional_holiday', label: 'Ponto Facultativo' },
  { value: 'company_event', label: 'Evento da Empresa' },
];

const EventsSettings = () => {
  const { scheduleData, addEvent, updateEvent, deleteEvent } = useSchedule();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    description: '',
    type: 'common',
    color: COLOR_PALETTE[0]
  });

  const resetForm = () => {
    setNewEvent({
      name: '',
      date: '',
      time: '',
      description: '',
      type: 'common',
      color: COLOR_PALETTE[0]
    });
    setEditingId(null);
  };

  const handleStartEdit = (event: Event) => {
    setEditingId(event.id);
    setNewEvent({
      name: event.name,
      date: event.date,
      time: event.time,
      description: event.description || '',
      type: (event.type as any) || 'common',
      color: event.color || COLOR_PALETTE[0]
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!newEvent.name || !newEvent.date) return;

    const eventPayload = {
      name: newEvent.name,
      date: newEvent.date,
      time: newEvent.time || '',
      description: newEvent.description || '',
      type: newEvent.type as any,
      color: newEvent.color
    };

    if (editingId) {
      updateEvent(editingId, eventPayload);
    } else {
      addEvent(eventPayload);
    }
    resetForm();
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      deleteEvent(eventId);
      if (editingId === eventId) resetForm();
    }
  };

  // Grouping events
  const holidays = scheduleData.settings.events.filter(e => e.type === 'national_holiday' || e.type === 'optional_holiday');
  const otherEvents = scheduleData.settings.events.filter(e => e.type !== 'national_holiday' && e.type !== 'optional_holiday');

  const renderEventList = (title: string, events: Event[]) => {
    if (events.length === 0) return null;
    return (
      <div className="neuro-inset p-6 rounded-2xl bg-neuro-surface mb-6">
        <h3 className="text-lg font-semibold text-neuro-text-primary mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title} ({events.length})
        </h3>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-xl flex items-center justify-between border border-gray-100 shadow-sm transition-all hover:shadow-md"
              style={{ backgroundColor: event.color || '#fff' }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 uppercase text-sm tracking-wide">{event.name}</span>
                  {event.type === 'national_holiday' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase">Feriado Nacional</span>}
                  {event.type === 'optional_holiday' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Ponto Facultativo</span>}
                </div>
                <div className="text-xs text-gray-600 mt-1 font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {event.time && (
                    <>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{event.time}</span>
                    </>
                  )}
                </div>
                {event.description && (
                  <div className="text-xs text-gray-500 mt-1 italic">{event.description}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStartEdit(event)}
                  className="h-8 w-8 bg-white/50 hover:bg-white text-gray-700 shadow-sm rounded-lg"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteEvent(event.id)}
                  className="h-8 w-8 bg-white/50 hover:bg-red-50 hover:text-red-600 text-gray-700 shadow-sm rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="neuro-outset-sm p-3 rounded-2xl">
          <Calendar className="h-6 w-6 text-neuro-accent" />
        </div>
        <h2 className="text-2xl font-bold text-neuro-text-primary">Gerenciar Feriados e Eventos</h2>
      </div>

      {/* Form */}
      <div className="neuro-inset p-6 rounded-2xl bg-neuro-surface shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neuro-text-primary">
            {editingId ? 'Editar Item' : 'Adicionar Novo Item'}
          </h3>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm} className="text-red-500 hover:bg-red-50 h-8">
              <X className="h-4 w-4 mr-1" /> Cancelar Edição
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Linha 1 */}
          <div className="md:col-span-4">
            <Label className="text-xs font-bold text-neuro-text-secondary uppercase mb-1 block">Nome *</Label>
            <Input
              value={newEvent.name}
              onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Natal, Reunião Mensal"
              className="bg-neuro-element border-none h-10"
            />
          </div>

          <div className="md:col-span-3">
            <Label className="text-xs font-bold text-neuro-text-secondary uppercase mb-1 block">Tipo *</Label>
            <Select value={newEvent.type} onValueChange={(v) => setNewEvent(prev => ({ ...prev, type: v }))}>
              <SelectTrigger className="bg-neuro-element border-none h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Label className="text-xs font-bold text-neuro-text-secondary uppercase mb-1 block">Data *</Label>
            <Input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
              className="bg-neuro-element border-none h-10"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs font-bold text-neuro-text-secondary uppercase mb-1 block">Horário</Label>
            <Input
              type="time"
              value={newEvent.time}
              onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
              className="bg-neuro-element border-none h-10"
            />
          </div>

          {/* Linha 2 */}
          <div className="md:col-span-6">
            <Label className="text-xs font-bold text-neuro-text-secondary uppercase mb-1 block">Descrição (Opcional)</Label>
            <Input
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes adicionais..."
              className="bg-neuro-element border-none h-10"
            />
          </div>

          <div className="md:col-span-6 flex flex-col justify-end">
            <Label className="text-xs font-bold text-neuro-text-secondary uppercase mb-2 block">Cor de Fundo</Label>
            <div className="flex items-center gap-3 bg-neuro-element p-2 rounded-xl w-full h-10 overflow-x-auto">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewEvent(prev => ({ ...prev, color: c }))}
                  className={cn(
                    "w-6 h-6 rounded-full border shadow-sm transition-transform hover:scale-110 flex items-center justify-center shrink-0",
                    newEvent.color === c ? "ring-2 ring-neuro-accent ring-offset-2 scale-110" : "border-gray-200"
                  )}
                  style={{ backgroundColor: c }}
                >
                  {newEvent.color === c && <Check className="h-3 w-3 text-black/50" />}
                </button>
              ))}
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="md:col-span-12 mt-2">
            <Button
              onClick={handleSave}
              disabled={!newEvent.name || !newEvent.date}
              className={cn(
                "w-full h-10 font-bold tracking-wide transition-all",
                editingId ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-neuro-accent hover:bg-neuro-accent-light text-white"
              )}
            >
              {editingId ? (
                <><Edit className="w-4 h-4 mr-2" /> ATUALIZAR ITEM</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> ADICIONAR</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Listas */}
      {renderEventList('Feriados', holidays)}
      {renderEventList('Outros Eventos', otherEvents)}

      {scheduleData.settings.events.length === 0 && (
        <div className="neuro-inset p-8 rounded-2xl bg-neuro-surface text-center">
          <p className="text-neuro-text-secondary">Nenhum evento registrado.</p>
        </div>
      )}
    </div>
  );
};

export default EventsSettings;
