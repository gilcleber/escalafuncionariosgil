
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Save, X, AlertTriangle, Settings } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { WorkScale, WorkRule, Employee } from '@/types/employee';
import { validateWorkRules } from '@/utils/workRules';

const UnifiedRules: React.FC = () => {
  const { scheduleData, updateSettings, updateEmployeeWorkRule, getEmployeeWorkRule } = useSchedule();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedWorkScale, setSelectedWorkScale] = useState<WorkScale | null>(null);
  const [customRules, setCustomRules] = useState<Partial<WorkRule>>({});
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [isAddingScale, setIsAddingScale] = useState(false);
  const [editingScaleId, setEditingScaleId] = useState<string | null>(null);
  const [scaleFormData, setScaleFormData] = useState<Partial<WorkScale>>({
    name: '',
    type: 'personalizada',
    workDays: 5,
    restDays: 2,
    weeklyHours: 40,
    dailyHours: 8,
    description: ''
  });

  // Add safety checks for undefined data
  const employees = scheduleData?.employees || [];
  const employeeWorkRules = scheduleData?.settings?.employeeWorkRules || [];
  
  // Escalas de trabalho padrão se não houver no sistema
  const defaultWorkScales: WorkScale[] = [
    {
      id: '5x2',
      name: '5x2 (44h semanais)',
      type: '5x2',
      description: '5 dias de trabalho, 2 dias de folga',
      workDays: 5,
      restDays: 2,
      weeklyHours: 44,
      dailyHours: 8.8
    },
    {
      id: '6x1',
      name: '6x1 (44h semanais)',
      type: '6x1',
      description: '6 dias de trabalho, 1 dia de folga',
      workDays: 6,
      restDays: 1,
      weeklyHours: 44,
      dailyHours: 7.33
    },
    {
      id: '12x36',
      name: '12x36 (36h semanais)',
      type: '12x36',
      description: '12 horas de trabalho, 36 horas de folga',
      workDays: 1,
      restDays: 1.5,
      weeklyHours: 36,
      dailyHours: 12
    },
    {
      id: '24x48',
      name: '24x48',
      type: '24x48',
      description: '24 horas de trabalho, 48 horas de folga',
      workDays: 1,
      restDays: 2,
      weeklyHours: 56,
      dailyHours: 24
    }
  ];
  
  // Usar escalas do sistema ou padrão
  const workScales = scheduleData?.settings?.workScales?.length > 0 
    ? scheduleData.settings.workScales 
    : defaultWorkScales;

  // Show validation warnings for employees with rule violations
  const getEmployeeViolations = (employeeId: string) => {
    const employeeRule = getEmployeeWorkRule(employeeId);
    if (!employeeRule) return [];
    
    const defaultRules: WorkRule = {
      maxConsecutiveDays: 6,
      maxSundaysPerMonth: 3,
      workHoursPerDay: 8,
      holidayCountsAsWork: false
    };
    
    const rules: WorkRule = { 
      ...defaultRules, 
      ...employeeRule.customRules 
    };
    
    return validateWorkRules(
      scheduleData?.shifts || [],
      employeeId,
      scheduleData?.month || new Date().getMonth(),
      scheduleData?.year || new Date().getFullYear(),
      rules
    );
  };

  const handleSaveEmployeeRule = () => {
    if (!selectedEmployee || !selectedWorkScale) {
      alert('Por favor, selecione um funcionário e uma escala de trabalho.');
      return;
    }

    try {
      updateEmployeeWorkRule(selectedEmployee, selectedWorkScale, customRules);
      alert('Regra de trabalho salva com sucesso!');
      
      // Reset form
      setSelectedEmployee('');
      setSelectedWorkScale(null);
      setCustomRules({});
      setEditingEmployee(null);
    } catch (error) {
      alert('Erro ao salvar regra de trabalho. Tente novamente.');
      console.error('Error saving rule:', error);
    }
  };

  const handleEditEmployeeRule = (employeeId: string) => {
    const existingRule = getEmployeeWorkRule(employeeId);
    if (existingRule) {
      setSelectedEmployee(employeeId);
      setSelectedWorkScale(existingRule.workScale);
      setCustomRules(existingRule.customRules || {});
      setEditingEmployee(employeeId);
    }
  };

  const handleCancelEdit = () => {
    setSelectedEmployee('');
    setSelectedWorkScale(null);
    setCustomRules({});
    setEditingEmployee(null);
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.name || 'Funcionário não encontrado';
  };

  const getWorkScaleBadgeColor = (type: WorkScale['type']) => {
    switch (type) {
      case '5x2': return 'bg-blue-100 text-blue-800';
      case '6x1': return 'bg-green-100 text-green-800';
      case '12x36': return 'bg-purple-100 text-purple-800';
      case '24x48': return 'bg-orange-100 text-orange-800';
      case 'revezamento': return 'bg-cyan-100 text-cyan-800';
      case 'tempo_parcial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveWorkScale = () => {
    if (!scaleFormData.name || !scaleFormData.weeklyHours || !scaleFormData.dailyHours) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const newWorkScale: WorkScale = {
      id: editingScaleId || `custom_${Date.now()}`,
      name: scaleFormData.name!,
      type: scaleFormData.type as WorkScale['type'],
      workDays: scaleFormData.workDays!,
      restDays: scaleFormData.restDays!,
      weeklyHours: scaleFormData.weeklyHours!,
      dailyHours: scaleFormData.dailyHours!,
      description: scaleFormData.description || ''
    };

    const currentWorkScales = scheduleData?.settings?.workScales || [];
    let updatedWorkScales;

    if (editingScaleId) {
      // Update existing
      updatedWorkScales = currentWorkScales.map(ws => 
        ws.id === editingScaleId ? newWorkScale : ws
      );
    } else {
      // Add new
      updatedWorkScales = [...currentWorkScales, newWorkScale];
    }

    updateSettings({
      workScales: updatedWorkScales
    });

    // Reset form
    setScaleFormData({
      name: '',
      type: 'personalizada',
      workDays: 5,
      restDays: 2,
      weeklyHours: 40,
      dailyHours: 8,
      description: ''
    });
    setIsAddingScale(false);
    setEditingScaleId(null);
  };

  const handleEditWorkScale = (workScale: WorkScale) => {
    setScaleFormData(workScale);
    setEditingScaleId(workScale.id);
    setIsAddingScale(true);
  };

  const handleDeleteWorkScale = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta escala de trabalho?')) {
      const currentWorkScales = scheduleData?.settings?.workScales || [];
      const updatedWorkScales = currentWorkScales.filter(ws => ws.id !== id);
      
      updateSettings({
        workScales: updatedWorkScales
      });
    }
  };

  const handleCancelScale = () => {
    setScaleFormData({
      name: '',
      type: 'personalizada',
      workDays: 5,
      restDays: 2,
      weeklyHours: 40,
      dailyHours: 8,
      description: ''
    });
    setIsAddingScale(false);
    setEditingScaleId(null);
  };

  function handleUpdateWorkRules(field: keyof WorkRule, value: number | boolean) {
    const currentRules = scheduleData?.settings?.workRules || {
      maxConsecutiveDays: 6,
      maxSundaysPerMonth: 3,
      workHoursPerDay: 8,
      holidayCountsAsWork: false
    };
    
    updateSettings({
      workRules: {
        ...currentRules,
        [field]: value
      }
    });
  }

  // Show loading state if data is not yet available
  if (!scheduleData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-neuro-accent" />
          <h2 className="text-2xl font-bold text-neuro-text-primary">Regras Unificadas do Sistema</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-neuro-text-secondary">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-neuro-accent" />
        <h2 className="text-2xl font-bold text-neuro-text-primary">Regras Unificadas do Sistema</h2>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 neuro-outset bg-neuro-surface p-2 rounded-3xl">
          <TabsTrigger 
            value="general"
            className="rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element data-[state=active]:text-neuro-text-primary text-neuro-text-secondary hover:text-neuro-text-primary font-medium"
          >
            Regras Gerais
          </TabsTrigger>
          <TabsTrigger 
            value="employees"
            className="rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element data-[state=active]:text-neuro-text-primary text-neuro-text-secondary hover:text-neuro-text-primary font-medium"
          >
            Regras por Funcionário
          </TabsTrigger>
          <TabsTrigger 
            value="scales"
            className="rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element data-[state=active]:text-neuro-text-primary text-neuro-text-secondary hover:text-neuro-text-primary font-medium"
          >
            Escalas de Trabalho
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
            <h3 className="text-xl font-bold text-neuro-text-primary mb-2">Regras Gerais de Trabalho</h3>
            <p className="text-sm text-neuro-text-secondary mb-6">
              Estas são as regras padrão aplicadas quando não há regras específicas definidas para um funcionário.
            </p>
            
            <div className="neuro-inset p-4 rounded-xl bg-neuro-surface space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-neuro-text-primary">Máximo de dias consecutivos</Label>
                  <Input 
                    type="number"
                    value={scheduleData?.settings?.workRules?.maxConsecutiveDays || 6}
                    onChange={(e) => handleUpdateWorkRules('maxConsecutiveDays', parseInt(e.target.value))}
                    min="1"
                    max="10"
                    className="neuro-inset bg-neuro-element border-none text-neuro-text-primary"
                  />
                </div>
                <div>
                  <Label className="text-neuro-text-primary">Máximo de domingos por mês</Label>
                  <Input 
                    type="number"
                    value={scheduleData?.settings?.workRules?.maxSundaysPerMonth || 3}
                    onChange={(e) => handleUpdateWorkRules('maxSundaysPerMonth', parseInt(e.target.value))}
                    min="0"
                    max="5"
                    className="neuro-inset bg-neuro-element border-none text-neuro-text-primary"
                  />
                </div>
                <div>
                  <Label className="text-neuro-text-primary">Horas de trabalho por dia</Label>
                  <Input 
                    type="number"
                    value={scheduleData?.settings?.workRules?.workHoursPerDay || 8}
                    onChange={(e) => handleUpdateWorkRules('workHoursPerDay', parseInt(e.target.value))}
                    min="4"
                    max="12"
                    className="neuro-inset bg-neuro-element border-none text-neuro-text-primary"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    checked={!(scheduleData?.settings?.workRules?.holidayCountsAsWork || false)}
                    onChange={(e) => handleUpdateWorkRules('holidayCountsAsWork', !e.target.checked)}
                    className="rounded neuro-inset w-4 h-4"
                  />
                  <Label className="text-neuro-text-primary">Feriados não contam como folga</Label>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          {/* Form for assigning work rules */}
          <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-5 w-5 text-neuro-accent" />
              <h3 className="text-xl font-bold text-neuro-text-primary">
                {editingEmployee ? 'Editar Regra de Trabalho' : 'Definir Regra de Trabalho'}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-neuro-text-primary">Funcionário</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="neuro-inset bg-neuro-surface border-none text-neuro-text-primary">
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <span className="text-neuro-accent font-medium">{employee.name}</span> - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-neuro-text-primary">Escala de Trabalho</Label>
                  <Select 
                    value={selectedWorkScale?.id || ''} 
                    onValueChange={(value) => {
                      const workScale = workScales.find(ws => ws.id === value);
                      setSelectedWorkScale(workScale || null);
                    }}
                  >
                    <SelectTrigger className="neuro-inset bg-neuro-surface border-none text-neuro-text-primary">
                      <SelectValue placeholder="Selecione uma escala" />
                    </SelectTrigger>
                    <SelectContent>
                      {workScales.map((workScale) => (
                        <SelectItem key={workScale.id} value={workScale.id}>
                          {workScale.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Work Scale Details */}
              {selectedWorkScale && (
                <div className="neuro-inset p-4 rounded-xl bg-neuro-surface">
                  <h4 className="font-semibold mb-2 text-neuro-text-primary">{selectedWorkScale.name}</h4>
                  <p className="text-sm text-neuro-text-secondary mb-3">{selectedWorkScale.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-neuro-text-primary">Dias de trabalho:</span>
                      <p className="text-neuro-text-secondary">{selectedWorkScale.workDays}</p>
                    </div>
                    <div>
                      <span className="font-medium text-neuro-text-primary">Dias de folga:</span>
                      <p className="text-neuro-text-secondary">{selectedWorkScale.restDays}</p>
                    </div>
                    <div>
                      <span className="font-medium text-neuro-text-primary">Horas semanais:</span>
                      <p className="text-neuro-text-secondary">{selectedWorkScale.weeklyHours}h</p>
                    </div>
                    <div>
                      <span className="font-medium text-neuro-text-primary">Horas diárias:</span>
                      <p className="text-neuro-text-secondary">{selectedWorkScale.dailyHours}h</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Rules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-neuro-text-primary">Máx. dias consecutivos (personalizado)</Label>
                  <Input 
                    type="number"
                    value={customRules.maxConsecutiveDays || ''}
                    onChange={(e) => setCustomRules({
                      ...customRules, 
                      maxConsecutiveDays: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Deixe vazio para usar padrão"
                    className="neuro-inset bg-neuro-surface border-none text-neuro-text-primary"
                  />
                </div>
                <div>
                  <Label className="text-neuro-text-primary">Máx. domingos/mês (personalizado)</Label>
                  <Input 
                    type="number"
                    value={customRules.maxSundaysPerMonth || ''}
                    onChange={(e) => setCustomRules({
                      ...customRules, 
                      maxSundaysPerMonth: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Deixe vazio para usar padrão"
                    className="neuro-inset bg-neuro-surface border-none text-neuro-text-primary"
                  />
                </div>
                <div>
                  <Label className="text-neuro-text-primary">Horas/dia (personalizado)</Label>
                  <Input 
                    type="number"
                    value={customRules.workHoursPerDay || ''}
                    onChange={(e) => setCustomRules({
                      ...customRules, 
                      workHoursPerDay: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Deixe vazio para usar padrão"
                    className="neuro-inset bg-neuro-surface border-none text-neuro-text-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveEmployeeRule}
                  disabled={!selectedEmployee || !selectedWorkScale}
                  className="neuro-button flex items-center gap-2 text-neuro-text-primary"
                >
                  <Save className="h-4 w-4" />
                  {editingEmployee ? 'Atualizar Regra' : 'Salvar Regra'}
                </Button>
                {editingEmployee && (
                  <Button 
                    onClick={handleCancelEdit}
                    className="neuro-button flex items-center gap-2 text-neuro-text-primary"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Current Employee Rules with Violations */}
          <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
            <h3 className="text-xl font-bold text-neuro-text-primary mb-4">Regras Atuais dos Funcionários</h3>
            <div className="space-y-3">
              {employeeWorkRules.length === 0 ? (
                <p className="text-neuro-text-secondary text-center py-4">
                  Nenhuma regra de trabalho definida para os funcionários.
                </p>
              ) : (
                employeeWorkRules.map((rule) => {
                  const violations = getEmployeeViolations(rule.employeeId);
                  return (
                    <div key={rule.employeeId} className="neuro-inset rounded-xl bg-neuro-surface">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <h4 className="font-semibold text-neuro-accent">{getEmployeeName(rule.employeeId)}</h4>
                            <Badge className={getWorkScaleBadgeColor(rule.workScale.type)}>
                              {rule.workScale.name}
                            </Badge>
                          </div>
                          <div className="text-sm text-neuro-text-secondary">
                            <p>{rule.workScale.weeklyHours}h semanais • {rule.workScale.dailyHours}h diárias</p>
                            {rule.customRules && Object.keys(rule.customRules).length > 0 && (
                              <p className="text-neuro-accent">Com regras personalizadas</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleEditEmployeeRule(rule.employeeId)}
                          className="neuro-button flex items-center gap-2 text-neuro-text-primary"
                          size="sm"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                      </div>
                      
                      {/* Show violations if any */}
                      {violations.length > 0 && (
                        <div className="border-t border-neuro-text-muted/20 bg-neuro-error/10 p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-neuro-error mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-neuro-error text-sm">Violações Detectadas:</p>
                              <ul className="text-sm text-neuro-error mt-1 space-y-1">
                                {violations.map((violation, index) => (
                                  <li key={index} className="list-disc list-inside">{violation}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scales" className="space-y-6">
          <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-neuro-text-primary">Escalas de Trabalho</h3>
              <Button 
                onClick={() => setIsAddingScale(true)}
                disabled={isAddingScale}
                className="neuro-button flex items-center gap-2 text-neuro-text-primary"
              >
                <Plus className="h-4 w-4" />
                Nova Escala
              </Button>
            </div>

            {/* Form for adding/editing work scales */}
            {isAddingScale && (
              <div className="neuro-inset p-6 rounded-xl bg-neuro-surface mb-6">
                <h4 className="text-lg font-bold text-neuro-text-primary mb-4">
                  {editingScaleId ? 'Editar Escala' : 'Nova Escala de Trabalho'}
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-neuro-text-primary">Nome da Escala *</Label>
                      <Input
                        id="name"
                        value={scaleFormData.name}
                        onChange={(e) => setScaleFormData({ ...scaleFormData, name: e.target.value })}
                        placeholder="Ex: Escala Especial 6x1"
                        className="neuro-inset bg-neuro-element border-none text-neuro-text-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type" className="text-neuro-text-primary">Tipo</Label>
                      <select
                        id="type"
                        value={scaleFormData.type}
                        onChange={(e) => setScaleFormData({ ...scaleFormData, type: e.target.value as WorkScale['type'] })}
                        className="w-full px-3 py-2 neuro-inset rounded-xl bg-neuro-element text-neuro-text-primary focus:outline-none focus:ring-2 focus:ring-neuro-accent/20"
                      >
                        <option value="personalizada">Personalizada</option>
                        <option value="radio_jornalismo">Rádio/Jornalismo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="workDays" className="text-neuro-text-primary">Dias de Trabalho *</Label>
                      <Input
                        id="workDays"
                        type="number"
                        min="1"
                        max="7"
                        value={scaleFormData.workDays}
                        onChange={(e) => setScaleFormData({ ...scaleFormData, workDays: parseInt(e.target.value) })}
                        className="neuro-inset bg-neuro-element border-none text-neuro-text-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="restDays" className="text-neuro-text-primary">Dias de Folga *</Label>
                      <Input
                        id="restDays"
                        type="number"
                        min="0"
                        max="7"
                        step="0.5"
                        value={scaleFormData.restDays}
                        onChange={(e) => setScaleFormData({ ...scaleFormData, restDays: parseFloat(e.target.value) })}
                        className="neuro-inset bg-neuro-element border-none text-neuro-text-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weeklyHours" className="text-neuro-text-primary">Horas Semanais *</Label>
                      <Input
                        id="weeklyHours"
                        type="number"
                        min="1"
                        max="80"
                        value={scaleFormData.weeklyHours}
                        onChange={(e) => setScaleFormData({ ...scaleFormData, weeklyHours: parseInt(e.target.value) })}
                        className="neuro-inset bg-neuro-element border-none text-neuro-text-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dailyHours" className="text-neuro-text-primary">Horas Diárias *</Label>
                      <Input
                        id="dailyHours"
                        type="number"
                        min="1"
                        max="24"
                        step="0.1"
                        value={scaleFormData.dailyHours}
                        onChange={(e) => setScaleFormData({ ...scaleFormData, dailyHours: parseFloat(e.target.value) })}
                        className="neuro-inset bg-neuro-element border-none text-neuro-text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-neuro-text-primary">Descrição</Label>
                    <Textarea
                      id="description"
                      value={scaleFormData.description}
                      onChange={(e) => setScaleFormData({ ...scaleFormData, description: e.target.value })}
                      placeholder="Descreva as características desta escala de trabalho..."
                      rows={3}
                      className="neuro-inset bg-neuro-element border-none text-neuro-text-primary"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveWorkScale} className="neuro-button flex items-center gap-2 text-neuro-text-primary">
                      <Save className="h-4 w-4" />
                      {editingScaleId ? 'Atualizar' : 'Salvar'}
                    </Button>
                    <Button onClick={handleCancelScale} className="neuro-button flex items-center gap-2 text-neuro-text-primary">
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Available Work Scales */}
            <div className="space-y-3">
              {workScales.length === 0 ? (
                <div className="neuro-inset p-6 rounded-xl bg-neuro-surface text-center">
                  <p className="text-neuro-text-secondary">Nenhuma escala de trabalho cadastrada.</p>
                </div>
              ) : (
                workScales.map((workScale) => (
                  <div key={workScale.id} className="neuro-inset rounded-xl bg-neuro-surface">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h4 className="font-semibold text-neuro-text-primary">{workScale.name}</h4>
                            <Badge variant="outline" className="mt-1 border-neuro-text-muted text-neuro-text-secondary">
                              {workScale.type === 'radio_jornalismo' ? 'Rádio/Jornalismo' : workScale.type.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-neuro-text-secondary">
                            <p>{workScale.workDays} dias trabalho • {workScale.restDays} dias folga</p>
                            <p>{workScale.weeklyHours}h semanais • {workScale.dailyHours}h diárias</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditWorkScale(workScale)}
                            className="neuro-button flex items-center gap-2 text-neuro-text-primary"
                            size="sm"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                          {(workScale.type === 'personalizada' || workScale.type === 'radio_jornalismo') && (
                            <Button
                              onClick={() => handleDeleteWorkScale(workScale.id)}
                              className="neuro-button flex items-center gap-2 text-neuro-error hover:bg-neuro-error/10"
                              size="sm"
                            >
                              <Trash2 className="h-3 w-3" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </div>
                      {workScale.description && (
                        <p className="text-sm text-neuro-text-secondary mt-2">{workScale.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedRules;
