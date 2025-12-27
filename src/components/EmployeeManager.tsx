

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Users, ArrowUp, ArrowDown, RotateCcw, Archive, Download, Upload } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { Employee } from '@/types/employee';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';


const EmployeeManager = () => {
  const { scheduleData, addEmployee, updateEmployee, deleteEmployee, archiveEmployee, restoreEmployee, reorderEmployees } = useSchedule();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({ name: '', position: '' });

  // Archive Dialog State
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [employeeToArchive, setEmployeeToArchive] = useState<string | null>(null);
  const [archiveDate, setArchiveDate] = useState('');



  const handleAddEmployee = () => {
    if (newEmployee.name.trim()) {
      addEmployee({
        name: newEmployee.name.trim(),
        position: newEmployee.position.trim() || 'Funcionário',
        defaultShift: 'E-08h00 / S-17h00'
      });
      setNewEmployee({ name: '', position: '' });
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setIsEditing(employee.id);
  };

  const handleSaveEmployee = (employeeId: string, updatedData: Partial<Employee>) => {
    updateEmployee(employeeId, updatedData);
    setIsEditing(null);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (confirm('Tem certeza que deseja remover PERMANENTEMENTE este funcionário?')) {
      deleteEmployee(employeeId);
    }
  };

  const openArchiveDialog = (id: string) => {
    setEmployeeToArchive(id);
    setArchiveDate(new Date().toISOString().split('T')[0]); // Default to today
    setIsArchiveDialogOpen(true);
  };

  const handleConfirmArchive = () => {
    if (employeeToArchive && archiveDate) {
      archiveEmployee(employeeToArchive, archiveDate);
      setIsArchiveDialogOpen(false);
      setEmployeeToArchive(null);
      setArchiveDate('');
    }
  };

  const handleRestore = (id: string) => {
    if (confirm('Deseja restaurar este funcionário?')) {
      restoreEmployee(id);
    }
  };

  const moveEmployee = (index: number, direction: 'up' | 'down') => {
    const list = [...scheduleData.employees];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= list.length) return;

    // Swap
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;

    // Update display orders
    // Use the current index in the array as the order
    const updates = list.map((emp, i) => ({
      id: emp.id,
      displayOrder: i + 1
    }));

    reorderEmployees(updates);
  };



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="neuro-card p-8 text-center relative">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="neuro-outset-sm p-4 rounded-2xl">
            <Users className="h-8 w-8 text-neuro-accent" />
          </div>
          <h1 className="text-4xl font-bold text-neuro-text-primary">
            Gerenciar Funcionários
          </h1>
        </div>
        <p className="text-lg text-neuro-text-secondary">
          Adicione, edite e organize a sua equipe (Ativos e Arquivados)
        </p>
      </div>

      {/* Add New Employee */}
      <div className="neuro-card p-6">
        <h2 className="text-2xl font-bold mb-6 text-neuro-text-primary">Adicionar Novo Funcionário</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="name" className="text-neuro-text-primary font-semibold">Nome</Label>
            <Input
              id="name"
              className="neuro-input mt-2"
              placeholder="Nome do funcionário"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="position" className="text-neuro-text-primary font-semibold">Cargo</Label>
            <Input
              id="position"
              className="neuro-input mt-2"
              placeholder="Cargo do funcionário"
              value={newEmployee.position}
              onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAddEmployee}
              className="w-full neuro-button text-neuro-text-primary font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="neuro-card p-6">
        <h2 className="text-2xl font-bold mb-6 text-neuro-text-primary">Lista de Funcionários</h2>
        <div className="space-y-4">
          {[...scheduleData.employees]
            .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
            .map((employee: Employee, index: number, arr: Employee[]) => {
              const isArchived = employee.active === false || !!employee.endDate;
              const cardStyle = isArchived
                ? "neuro-inset p-4 rounded-2xl bg-orange-50 border border-orange-200"
                : "neuro-inset p-4 rounded-2xl bg-neuro-element";

              return (
                <div key={employee.id} className={cardStyle}>
                  {isEditing === employee.id ? (
                    <EditEmployeeForm
                      employee={employee}
                      onSave={(updatedData) => handleSaveEmployee(employee.id, updatedData)}
                      onCancel={() => setIsEditing(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-neuro-text-primary">{employee.name}</h3>
                          {isArchived && (
                            <span className="text-xs text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                              Arquivado ({employee.endDate})
                            </span>
                          )}
                        </div>
                        <p className="text-neuro-text-secondary">{employee.position}</p>
                      </div>

                      <div className="flex gap-2 items-center">
                        {/* Reorder Buttons */}
                        <div className="flex gap-1 mr-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={() => moveEmployee(index, 'up')} disabled={index === 0}>
                            <ArrowUp className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={() => moveEmployee(index, 'down')} disabled={index === arr.length - 1}>
                            <ArrowDown className="h-4 w-4 text-gray-600" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                          className="neuro-button text-neuro-text-primary"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        {isArchived ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(employee.id)}
                            className="neuro-button text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Restaurar Funcionário"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openArchiveDialog(employee.id)}
                            className="neuro-button text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                            title="Arquivar Funcionário"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="neuro-button text-neuro-error hover:bg-red-50"
                          title="Excluir Permanentemente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          {scheduleData.employees.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-neuro-text-muted mx-auto mb-4" />
              <p className="text-lg text-neuro-text-muted">Nenhum funcionário cadastrado</p>
              <p className="text-neuro-text-muted">Adicione funcionários para começar a gerenciar as escalas</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent className="neuro-card bg-neuro-surface border-none">
          <DialogHeader>
            <DialogTitle className="text-neuro-text-primary">Arquivar Funcionário</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="archive-date" className="text-neuro-text-primary font-medium">Data de Saída:</Label>
            <Input
              type="date"
              id="archive-date"
              value={archiveDate}
              onChange={(e) => setArchiveDate(e.target.value)}
              className="mt-2 bg-white border-gray-200 text-gray-900 focus:ring-neuro-accent focus:border-neuro-accent"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsArchiveDialogOpen(false)} className="text-neuro-text-secondary">Cancelar</Button>
            <Button onClick={handleConfirmArchive} className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-sm">Confirmar Arquivamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EditEmployeeForm = ({ employee, onSave, onCancel }: {
  employee: Employee;
  onSave: (data: Partial<Employee>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: employee.name,
    position: employee.position,
    endDate: employee.endDate || ''
  });

  const handleSave = () => {
    onSave(formData);
  };

  const isArchived = employee.active === false || !!employee.endDate;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-name" className="text-neuro-text-primary font-semibold">Nome</Label>
          <Input
            id="edit-name"
            className="neuro-input mt-2"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="edit-position" className="text-neuro-text-primary font-semibold">Cargo</Label>
          <Input
            id="edit-position"
            className="neuro-input mt-2"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          />
        </div>
        {isArchived && (
          <div className="md:col-span-2">
            <Label htmlFor="edit-end-date" className="text-neuro-text-primary font-semibold">Data de Arquivamento (Saída)</Label>
            <Input
              type="date"
              id="edit-end-date"
              className="neuro-input mt-2 bg-orange-50 border-orange-200"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="neuro-button text-neuro-text-secondary"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="neuro-button text-neuro-text-primary font-semibold"
        >
          Salvar
        </Button>
      </div>
    </div>
  );
};

export default EmployeeManager;
