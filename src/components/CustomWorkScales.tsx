
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { WorkScale } from '@/types/employee';

const CustomWorkScales: React.FC = () => {
  const { scheduleData, updateSettings } = useSchedule();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<WorkScale>>({
    name: '',
    type: 'personalizada',
    workDays: 5,
    restDays: 2,
    weeklyHours: 40,
    dailyHours: 8,
    description: ''
  });

  const customWorkScales = scheduleData?.settings?.workScales?.filter(ws => 
    ws.type === 'personalizada' || ws.type === 'radio_jornalismo'
  ) || [];

  const handleSave = () => {
    if (!formData.name || !formData.weeklyHours || !formData.dailyHours) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const newWorkScale: WorkScale = {
      id: editingId || `custom_${Date.now()}`,
      name: formData.name!,
      type: formData.type as WorkScale['type'],
      workDays: formData.workDays!,
      restDays: formData.restDays!,
      weeklyHours: formData.weeklyHours!,
      dailyHours: formData.dailyHours!,
      description: formData.description || ''
    };

    const currentWorkScales = scheduleData?.settings?.workScales || [];
    let updatedWorkScales;

    if (editingId) {
      // Update existing
      updatedWorkScales = currentWorkScales.map(ws => 
        ws.id === editingId ? newWorkScale : ws
      );
    } else {
      // Add new
      updatedWorkScales = [...currentWorkScales, newWorkScale];
    }

    updateSettings({
      workScales: updatedWorkScales
    });

    // Reset form
    setFormData({
      name: '',
      type: 'personalizada',
      workDays: 5,
      restDays: 2,
      weeklyHours: 40,
      dailyHours: 8,
      description: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (workScale: WorkScale) => {
    setFormData(workScale);
    setEditingId(workScale.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta escala de trabalho?')) {
      const currentWorkScales = scheduleData?.settings?.workScales || [];
      const updatedWorkScales = currentWorkScales.filter(ws => ws.id !== id);
      
      updateSettings({
        workScales: updatedWorkScales
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      type: 'personalizada',
      workDays: 5,
      restDays: 2,
      weeklyHours: 40,
      dailyHours: 8,
      description: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-neuro-text-primary">Escalas Personalizadas</h3>
        <Button 
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="flex items-center gap-2 neuro-button"
        >
          <Plus className="h-4 w-4" />
          Nova Escala
        </Button>
      </div>

      {/* Form for adding/editing custom work scales */}
      {isAdding && (
        <div className="neuro-card bg-neuro-element rounded-2xl">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-neuro-text-primary mb-4">
              {editingId ? 'Editar Escala' : 'Nova Escala de Trabalho'}
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-neuro-text-primary font-medium">Nome da Escala *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Escala Especial 6x1"
                    className="neuro-input mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-neuro-text-primary font-medium">Tipo</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkScale['type'] })}
                    className="w-full px-3 py-2 mt-1 neuro-input rounded-xl"
                  >
                    <option value="personalizada">Personalizada</option>
                    <option value="radio_jornalismo">Rádio/Jornalismo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="workDays" className="text-neuro-text-primary font-medium">Dias de Trabalho *</Label>
                  <Input
                    id="workDays"
                    type="number"
                    min="1"
                    max="7"
                    value={formData.workDays}
                    onChange={(e) => setFormData({ ...formData, workDays: parseInt(e.target.value) })}
                    className="neuro-input mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="restDays" className="text-neuro-text-primary font-medium">Dias de Folga *</Label>
                  <Input
                    id="restDays"
                    type="number"
                    min="0"
                    max="7"
                    step="0.5"
                    value={formData.restDays}
                    onChange={(e) => setFormData({ ...formData, restDays: parseFloat(e.target.value) })}
                    className="neuro-input mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="weeklyHours" className="text-neuro-text-primary font-medium">Horas Semanais *</Label>
                  <Input
                    id="weeklyHours"
                    type="number"
                    min="1"
                    max="80"
                    value={formData.weeklyHours}
                    onChange={(e) => setFormData({ ...formData, weeklyHours: parseInt(e.target.value) })}
                    className="neuro-input mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dailyHours" className="text-neuro-text-primary font-medium">Horas Diárias *</Label>
                  <Input
                    id="dailyHours"
                    type="number"
                    min="1"
                    max="24"
                    step="0.1"
                    value={formData.dailyHours}
                    onChange={(e) => setFormData({ ...formData, dailyHours: parseFloat(e.target.value) })}
                    className="neuro-input mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-neuro-text-primary font-medium">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva as características desta escala de trabalho..."
                  rows={3}
                  className="neuro-input mt-1"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex items-center gap-2 neuro-button">
                  <Save className="h-4 w-4" />
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2 neuro-button-secondary">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List of custom work scales */}
      <div className="space-y-3">
        {customWorkScales.length === 0 ? (
          <div className="neuro-card bg-neuro-element rounded-2xl">
            <div className="py-8 text-center text-neuro-text-muted">
              Nenhuma escala personalizada cadastrada.
            </div>
          </div>
        ) : (
          customWorkScales.map((workScale) => (
            <div key={workScale.id} className="neuro-card bg-neuro-element rounded-2xl">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-semibold text-neuro-text-primary">{workScale.name}</h4>
                      <Badge variant="outline" className="mt-1 neuro-badge">
                        {workScale.type === 'radio_jornalismo' ? 'Rádio/Jornalismo' : 'Personalizada'}
                      </Badge>
                    </div>
                    <div className="text-sm text-neuro-text-secondary">
                      <p>{workScale.workDays} dias trabalho • {workScale.restDays} dias folga</p>
                      <p>{workScale.weeklyHours}h semanais • {workScale.dailyHours}h diárias</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workScale)}
                      className="flex items-center gap-2 neuro-button-secondary"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(workScale.id)}
                      className="flex items-center gap-2 neuro-button-secondary text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
                {workScale.description && (
                  <p className="text-sm text-neuro-text-muted mt-2">{workScale.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomWorkScales;
