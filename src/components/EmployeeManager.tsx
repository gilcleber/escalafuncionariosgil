
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { Employee } from '@/types/employee';

const EmployeeManager = () => {
  const { scheduleData, addEmployee, updateEmployee, deleteEmployee } = useSchedule();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({ name: '', position: '' });

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
    if (confirm('Tem certeza que deseja remover este funcionário?')) {
      deleteEmployee(employeeId);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="neuro-card p-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="neuro-outset-sm p-4 rounded-2xl">
            <Users className="h-8 w-8 text-neuro-accent" />
          </div>
          <h1 className="text-4xl font-bold text-neuro-text-primary">
            Gerenciar Funcionários
          </h1>
        </div>
        <p className="text-lg text-neuro-text-secondary">
          Adicione, edite e gerencie os funcionários da sua empresa
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
          {scheduleData.employees.map((employee: Employee) => (
            <div key={employee.id} className="neuro-inset p-4 rounded-2xl bg-neuro-element">
              {isEditing === employee.id ? (
                <EditEmployeeForm
                  employee={employee}
                  onSave={(updatedData) => handleSaveEmployee(employee.id, updatedData)}
                  onCancel={() => setIsEditing(null)}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-neuro-text-primary">{employee.name}</h3>
                    <p className="text-neuro-text-secondary">{employee.position}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditEmployee(employee)}
                      className="neuro-button text-neuro-text-primary"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="neuro-button text-neuro-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {scheduleData.employees.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-neuro-text-muted mx-auto mb-4" />
              <p className="text-lg text-neuro-text-muted">Nenhum funcionário cadastrado</p>
              <p className="text-neuro-text-muted">Adicione funcionários para começar a gerenciar as escalas</p>
            </div>
          )}
        </div>
      </div>
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
    position: employee.position
  });

  const handleSave = () => {
    onSave(formData);
  };

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
