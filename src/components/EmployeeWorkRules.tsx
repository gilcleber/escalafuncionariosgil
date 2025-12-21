import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, Save, Edit, X, AlertTriangle } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { WorkScale, WorkRule, Employee } from '@/types/employee';
import { validateWorkRules } from '@/utils/workRules';
import CustomWorkScales from './CustomWorkScales';

const EmployeeWorkRules: React.FC = () => {
  const { scheduleData, updateEmployeeWorkRule, getEmployeeWorkRule } = useSchedule();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedWorkScale, setSelectedWorkScale] = useState<WorkScale | null>(null);
  const [customRules, setCustomRules] = useState<Partial<WorkRule>>({});
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);

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
    
    const defaultRules = scheduleData?.settings?.workRules || {
      maxConsecutiveDays: 6,
      maxSundaysPerMonth: 3,
      workHoursPerDay: 8,
      holidayCountsAsWork: false
    };
    
    const rules = { ...defaultRules, ...employeeRule.customRules };
    
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

  // Show loading state if data is not yet available
  if (!scheduleData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Regras de Trabalho por Funcionário</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Regras de Trabalho por Funcionário</h2>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rules">Regras dos Funcionários</TabsTrigger>
          <TabsTrigger value="scales">Escalas Personalizadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules" className="space-y-6">
          {/* Form for assigning work rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {editingEmployee ? 'Editar Regra de Trabalho' : 'Definir Regra de Trabalho'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Funcionário</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Escala de Trabalho</Label>
                  <Select 
                    value={selectedWorkScale?.id || ''} 
                    onValueChange={(value) => {
                      const workScale = workScales.find(ws => ws.id === value);
                      setSelectedWorkScale(workScale || null);
                    }}
                  >
                    <SelectTrigger>
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
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedWorkScale.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{selectedWorkScale.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Dias de trabalho:</span>
                      <p>{selectedWorkScale.workDays}</p>
                    </div>
                    <div>
                      <span className="font-medium">Dias de folga:</span>
                      <p>{selectedWorkScale.restDays}</p>
                    </div>
                    <div>
                      <span className="font-medium">Horas semanais:</span>
                      <p>{selectedWorkScale.weeklyHours}h</p>
                    </div>
                    <div>
                      <span className="font-medium">Horas diárias:</span>
                      <p>{selectedWorkScale.dailyHours}h</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Rules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Máx. dias consecutivos (personalizado)</Label>
                  <Input 
                    type="number"
                    value={customRules.maxConsecutiveDays || ''}
                    onChange={(e) => setCustomRules({
                      ...customRules, 
                      maxConsecutiveDays: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Deixe vazio para usar padrão"
                  />
                </div>
                <div>
                  <Label>Máx. domingos/mês (personalizado)</Label>
                  <Input 
                    type="number"
                    value={customRules.maxSundaysPerMonth || ''}
                    onChange={(e) => setCustomRules({
                      ...customRules, 
                      maxSundaysPerMonth: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Deixe vazio para usar padrão"
                  />
                </div>
                <div>
                  <Label>Horas/dia (personalizado)</Label>
                  <Input 
                    type="number"
                    value={customRules.workHoursPerDay || ''}
                    onChange={(e) => setCustomRules({
                      ...customRules, 
                      workHoursPerDay: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Deixe vazio para usar padrão"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveEmployeeRule}
                  disabled={!selectedEmployee || !selectedWorkScale}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingEmployee ? 'Atualizar Regra' : 'Salvar Regra'}
                </Button>
                {editingEmployee && (
                  <Button 
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Employee Rules with Violations */}
          <Card>
            <CardHeader>
              <CardTitle>Regras Atuais dos Funcionários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeeWorkRules.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma regra de trabalho definida para os funcionários.
                  </p>
                ) : (
                  employeeWorkRules.map((rule) => {
                    const violations = getEmployeeViolations(rule.employeeId);
                    return (
                      <div key={rule.employeeId} className="border rounded-lg">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <h4 className="font-semibold">{getEmployeeName(rule.employeeId)}</h4>
                              <Badge className={getWorkScaleBadgeColor(rule.workScale.type)}>
                                {rule.workScale.name}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>{rule.workScale.weeklyHours}h semanais • {rule.workScale.dailyHours}h diárias</p>
                              {rule.customRules && Object.keys(rule.customRules).length > 0 && (
                                <p className="text-blue-600">Com regras personalizadas</p>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditEmployeeRule(rule.employeeId)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                        </div>
                        
                        {/* Show violations if any */}
                        {violations.length > 0 && (
                          <div className="border-t bg-red-50 p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-red-800 text-sm">Violações Detectadas:</p>
                                <ul className="text-sm text-red-700 mt-1 space-y-1">
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
            </CardContent>
          </Card>

          {/* Available Work Scales */}
          <Card>
            <CardHeader>
              <CardTitle>Escalas de Trabalho Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workScales.map((workScale) => (
                  <div key={workScale.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{workScale.name}</h4>
                      <Badge className={getWorkScaleBadgeColor(workScale.type)}>
                        {workScale.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{workScale.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Trabalho:</span> {workScale.workDays} dias
                      </div>
                      <div>
                        <span className="font-medium">Folga:</span> {workScale.restDays} dias
                      </div>
                      <div>
                        <span className="font-medium">Semanal:</span> {workScale.weeklyHours}h
                      </div>
                      <div>
                        <span className="font-medium">Diária:</span> {workScale.dailyHours}h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scales">
          <CustomWorkScales />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeWorkRules;
