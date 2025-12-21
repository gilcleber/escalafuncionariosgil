
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Plus } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { EmployeeRoutine } from '@/types/employee';

interface RoutineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  date: string;
}

const RoutineEditModal: React.FC<RoutineEditModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  date
}) => {
  const { scheduleData, addEmployeeRoutine, updateEmployeeRoutine, deleteEmployeeRoutine } = useSchedule();
  const [routines, setRoutines] = useState<EmployeeRoutine[]>([]);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    time: '',
    description: '',
    color: 'bg-purple-100'
  });

  const employee = scheduleData.employees.find(emp => emp.id === employeeId);

  useEffect(() => {
    if (isOpen) {
      const employeeRoutines = scheduleData.settings.employeeRoutines.filter(
        r => r.employeeId === employeeId && r.date === date
      );
      setRoutines(employeeRoutines);
    }
  }, [isOpen, employeeId, date, scheduleData.settings.employeeRoutines]);

  const handleAddRoutine = () => {
    // Apenas o nome é obrigatório, horário é opcional
    if (newRoutine.name.trim()) {
      addEmployeeRoutine({
        employeeId,
        date,
        name: newRoutine.name,
        time: newRoutine.time || '', // Horário opcional
        description: newRoutine.description,
        color: newRoutine.color
      });
      setNewRoutine({
        name: '',
        time: '',
        description: '',
        color: 'bg-purple-100'
      });
    }
  };

  const handleUpdateRoutine = (routineId: string, field: string, value: string) => {
    updateEmployeeRoutine(routineId, { [field]: value });
  };

  const handleDeleteRoutine = (routineId: string) => {
    deleteEmployeeRoutine(routineId);
  };

  const colorOptions = [
    { value: 'bg-purple-100', label: 'Roxo Claro' },
    { value: 'bg-blue-100', label: 'Azul Claro' },
    { value: 'bg-green-100', label: 'Verde Claro' },
    { value: 'bg-yellow-100', label: 'Amarelo Claro' },
    { value: 'bg-orange-100', label: 'Laranja Claro' },
    { value: 'bg-pink-100', label: 'Rosa Claro' },
    { value: 'bg-gray-100', label: 'Cinza Claro' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto neuro-card bg-neuro-surface">
        <DialogHeader>
          <DialogTitle className="text-neuro-text-primary">
            Gerenciar Rotinas/Tarefas - {employee?.name} ({date})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new routine */}
          <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
            <h3 className="text-lg font-semibold text-neuro-text-primary mb-4">Adicionar Nova Rotina/Tarefa</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="routine-name" className="text-neuro-text-primary">Nome da Rotina/Tarefa</Label>
                  <Input
                    id="routine-name"
                    value={newRoutine.name}
                    onChange={(e) => setNewRoutine(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Reunião, Treinamento, Manutenção..."
                    className="neuro-input bg-neuro-surface text-neuro-text-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="routine-time" className="text-neuro-text-primary">Horário (opcional)</Label>
                  <Input
                    id="routine-time"
                    type="time"
                    value={newRoutine.time}
                    onChange={(e) => setNewRoutine(prev => ({ ...prev, time: e.target.value }))}
                    className="neuro-input bg-neuro-surface text-neuro-text-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="routine-color" className="text-neuro-text-primary">Cor</Label>
                  <Select
                    value={newRoutine.color}
                    onValueChange={(value) => setNewRoutine(prev => ({ ...prev, color: value }))}
                  >
                    <SelectTrigger className="neuro-input bg-neuro-surface text-neuro-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="neuro-card bg-neuro-surface">
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-neuro-text-primary hover:bg-neuro-element">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${option.value}`}></div>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="routine-description" className="text-neuro-text-primary">Descrição (opcional)</Label>
                <Textarea
                  id="routine-description"
                  value={newRoutine.description}
                  onChange={(e) => setNewRoutine(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição adicional da rotina/tarefa..."
                  rows={2}
                  className="neuro-input bg-neuro-surface text-neuro-text-primary"
                />
              </div>
              <Button onClick={handleAddRoutine} className="w-full neuro-button text-neuro-text-primary">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Rotina/Tarefa
              </Button>
            </div>
          </div>

          {/* Existing routines */}
          {routines.length > 0 && (
            <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
              <h3 className="text-lg font-semibold text-neuro-text-primary mb-4">Rotinas/Tarefas Existentes</h3>
              <div className="space-y-4">
                {routines.map((routine) => (
                  <div key={routine.id} className="neuro-outset-sm p-4 rounded-xl bg-neuro-surface space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-neuro-text-primary">Nome</Label>
                        <Input
                          value={routine.name}
                          onChange={(e) => handleUpdateRoutine(routine.id, 'name', e.target.value)}
                          className="neuro-input bg-neuro-element text-neuro-text-primary"
                        />
                      </div>
                      <div>
                        <Label className="text-neuro-text-primary">Horário (opcional)</Label>
                        <Input
                          type="time"
                          value={routine.time || ''}
                          onChange={(e) => handleUpdateRoutine(routine.id, 'time', e.target.value)}
                          className="neuro-input bg-neuro-element text-neuro-text-primary"
                        />
                      </div>
                      <div>
                        <Label className="text-neuro-text-primary">Cor</Label>
                        <Select
                          value={routine.color || 'bg-purple-100'}
                          onValueChange={(value) => handleUpdateRoutine(routine.id, 'color', value)}
                        >
                          <SelectTrigger className="neuro-input bg-neuro-element text-neuro-text-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="neuro-card bg-neuro-surface">
                            {colorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-neuro-text-primary hover:bg-neuro-element">
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded ${option.value}`}></div>
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-neuro-text-primary">Descrição</Label>
                      <Textarea
                        value={routine.description || ''}
                        onChange={(e) => handleUpdateRoutine(routine.id, 'description', e.target.value)}
                        rows={2}
                        className="neuro-input bg-neuro-element text-neuro-text-primary"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRoutine(routine.id)}
                        className="neuro-button bg-neuro-error text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="neuro-button text-neuro-text-primary">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoutineEditModal;
