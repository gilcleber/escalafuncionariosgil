
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building, Palette, Settings, Users, Save, Plus, Edit, Trash2, X } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { CompanyProfile, DepartmentTemplate } from '@/types/employee';

// import { executeMigration } from '@/utils/migration';

import { supabase } from '@/integrations/supabase/client';
import { Database, AlertTriangle } from 'lucide-react';

const CompanySettings: React.FC = () => {
  const { scheduleData, updateSettings } = useSchedule();
  // const [isMigrating, setIsMigrating] = useState(false);

  /*
  const handleMigration = async () => {
    if (!confirm('ATENÇÃO: Isso copiará todos os dados atuais (JSON) para as novas tabelas do banco de dados.\n\nSeus dados atuais NÃO serão apagados.\n\nDeseja continuar?')) {
      return;
    }

    setIsMigrating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Erro: Usuário não autenticado.');
        return;
      }

      const result = await executeMigration(scheduleData, user.id);

      if (result.success) {
        alert(result.message);
      } else {
        alert(`${result.message}\n\nFalhas:\n${result.failures.join('\n')}`);
      }
    } catch (error: any) {
      alert(`Erro inesperado: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };
  */
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: scheduleData?.settings?.companyProfile?.name || '',
    logo: scheduleData?.settings?.companyProfile?.logo || '',
    primaryColor: scheduleData?.settings?.companyProfile?.primaryColor || '#3b82f6',
    secondaryColor: scheduleData?.settings?.companyProfile?.secondaryColor || '#64748b',
    description: scheduleData?.settings?.companyProfile?.description || ''
  });

  const [isEditingDepartment, setIsEditingDepartment] = useState<string | null>(null);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [departmentForm, setDepartmentForm] = useState<Partial<DepartmentTemplate>>({
    name: '',
    description: '',
    defaultWorkScale: '',
    defaultShifts: []
  });

  const departments = scheduleData?.settings?.departmentTemplates || [];
  const workScales = scheduleData?.settings?.workScales || [];
  const shiftTemplates = scheduleData?.settings?.shiftTemplates || [];

  const handleSaveCompanyProfile = () => {
    updateSettings({
      companyProfile: companyProfile
    });
    alert('Perfil da empresa salvo com sucesso!');
  };

  const handleSaveDepartment = () => {
    if (!departmentForm.name || !departmentForm.defaultWorkScale) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const newDepartment: DepartmentTemplate = {
      id: isEditingDepartment || `dept_${Date.now()}`,
      name: departmentForm.name!,
      description: departmentForm.description || '',
      defaultWorkScale: departmentForm.defaultWorkScale!,
      defaultShifts: departmentForm.defaultShifts || []
    };

    const currentDepartments = departments;
    let updatedDepartments;

    if (isEditingDepartment) {
      updatedDepartments = currentDepartments.map(dept =>
        dept.id === isEditingDepartment ? newDepartment : dept
      );
    } else {
      updatedDepartments = [...currentDepartments, newDepartment];
    }

    updateSettings({
      departmentTemplates: updatedDepartments
    });

    // Reset form
    setDepartmentForm({
      name: '',
      description: '',
      defaultWorkScale: '',
      defaultShifts: []
    });
    setIsAddingDepartment(false);
    setIsEditingDepartment(null);
    alert('Template de departamento salvo com sucesso!');
  };

  const handleEditDepartment = (department: DepartmentTemplate) => {
    setDepartmentForm(department);
    setIsEditingDepartment(department.id);
    setIsAddingDepartment(true);
  };

  const handleDeleteDepartment = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template de departamento?')) {
      const updatedDepartments = departments.filter(dept => dept.id !== id);
      updateSettings({
        departmentTemplates: updatedDepartments
      });
    }
  };

  const handleCancelDepartment = () => {
    setDepartmentForm({
      name: '',
      description: '',
      defaultWorkScale: '',
      defaultShifts: []
    });
    setIsAddingDepartment(false);
    setIsEditingDepartment(null);
  };

  // CORRIGIDO: Ampliada lista de cores predefinidas
  const predefinedColors = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Roxo', value: '#8b5cf6' },
    { name: 'Vermelho', value: '#ef4444' },
    { name: 'Laranja', value: '#f97316' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Amarelo', value: '#eab308' },
    { name: 'Ciano', value: '#06b6d4' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Âmbar', value: '#f59e0b' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Violet', value: '#7c3aed' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Zinc', value: '#71717a' },
    { name: 'Neutral', value: '#737373' },
    { name: 'Stone', value: '#78716c' },
    { name: 'Marinho', value: '#1e40af' },
    { name: 'Verde Escuro', value: '#065f46' },
    { name: 'Bordo', value: '#991b1b' },
    { name: 'Dourado', value: '#ca8a04' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="neuro-outset-sm p-3 rounded-2xl">
          <Building className="h-6 w-6 text-neuro-accent" />
        </div>
        <h2 className="text-2xl font-bold text-neuro-text-primary">Configurações da Empresa</h2>
      </div>



      {/* Company Profile */}
      <div className="neuro-card p-6">
        <div className="neuro-inset p-1 rounded-2xl bg-neuro-element mb-6">
          <div className="flex items-center gap-3 p-4">
            <div className="neuro-outset-sm p-2 rounded-xl">
              <Building className="h-5 w-5 text-neuro-accent" />
            </div>
            <h3 className="text-xl font-bold text-neuro-text-primary">Perfil da Empresa</h3>
          </div>
        </div>

        <div className="neuro-inset p-6 rounded-2xl bg-neuro-element space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName" className="text-neuro-text-primary font-medium">Nome da Empresa *</Label>
              <Input
                id="companyName"
                value={companyProfile.name}
                onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                placeholder="Digite o nome da empresa"
                className="neuro-input mt-1"
              />
            </div>
            <div>
              <Label htmlFor="companyLogo" className="text-neuro-text-primary font-medium">URL do Logo</Label>
              <Input
                id="companyLogo"
                value={companyProfile.logo}
                onChange={(e) => setCompanyProfile({ ...companyProfile, logo: e.target.value })}
                placeholder="https://exemplo.com/logo.png"
                className="neuro-input mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="companyDescription" className="text-neuro-text-primary font-medium">Descrição</Label>
            <Textarea
              id="companyDescription"
              value={companyProfile.description}
              onChange={(e) => setCompanyProfile({ ...companyProfile, description: e.target.value })}
              placeholder="Breve descrição da empresa..."
              rows={3}
              className="neuro-input mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor" className="text-neuro-text-primary font-medium">Cor Primária</Label>
              <div className="flex gap-2 items-center mt-1">
                <div className="neuro-inset rounded-xl p-1">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={companyProfile.primaryColor}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, primaryColor: e.target.value })}
                    className="w-16 h-10 border-none"
                  />
                </div>
                <Select
                  value={companyProfile.primaryColor}
                  onValueChange={(value) => setCompanyProfile({ ...companyProfile, primaryColor: value })}
                >
                  <SelectTrigger className="flex-1 neuro-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="neuro-outset bg-neuro-surface border-0 max-h-[200px] overflow-y-auto">
                    {predefinedColors.map((color) => (
                      <SelectItem key={color.value} value={color.value} className="neuro-hover">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded neuro-outset-sm"
                            style={{ backgroundColor: color.value }}
                          />
                          <span className="text-neuro-text-primary">{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="secondaryColor" className="text-neuro-text-primary font-medium">Cor Secundária</Label>
              <div className="flex gap-2 items-center mt-1">
                <div className="neuro-inset rounded-xl p-1">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={companyProfile.secondaryColor}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, secondaryColor: e.target.value })}
                    className="w-16 h-10 border-none"
                  />
                </div>
                <Select
                  value={companyProfile.secondaryColor}
                  onValueChange={(value) => setCompanyProfile({ ...companyProfile, secondaryColor: value })}
                >
                  <SelectTrigger className="flex-1 neuro-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="neuro-outset bg-neuro-surface border-0 max-h-[200px] overflow-y-auto">
                    {predefinedColors.map((color) => (
                      <SelectItem key={color.value} value={color.value} className="neuro-hover">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded neuro-outset-sm"
                            style={{ backgroundColor: color.value }}
                          />
                          <span className="text-neuro-text-primary">{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveCompanyProfile} className="neuro-button text-neuro-text-primary font-semibold">
              <Save className="h-4 w-4 mr-2" />
              Salvar Perfil
            </Button>
          </div>
        </div>
      </div>

      {/* Department Templates */}
      {/* MIGRATION SECTION (V2) - Inserted Here as Requested */}
      {/* Migration Section (V2) - Temporarily Disabled to prevent crash
      <div className="neuro-card p-6 border-2 border-yellow-500/20 mb-6">
        <div className="neuro-inset p-1 rounded-2xl bg-neuro-element mb-4">
          <div className="flex items-center gap-3 p-4">
            <div className="neuro-outset-sm p-2 rounded-xl">
              <Database className="h-5 w-5 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-neuro-text-primary">Migração de Banco de Dados (v2)</h3>
          </div>
        </div>

        <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
          <div className="flex items-start gap-4 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div className="text-sm text-neuro-text-secondary">
              <p className="font-bold text-neuro-text-primary mb-1">Área Técnica</p>
              <p>Utilize este botão para popular as novas tabelas relacionais com os dados atuais.</p>
              <p>O sistema continuará usando a versão antiga (JSON) até a troca oficial.</p>
            </div>
          </div>
          <Button
            onClick={handleMigration}
            disabled={isMigrating}
            className="w-full neuro-button text-neuro-text-primary font-bold bg-yellow-500/10 hover:bg-yellow-500/20"
          >
            {isMigrating ? 'Migrando...' : '🛠️ Executar Migração para V2'}
          </Button>
        </div>
      </div>
      */}

      <div className="neuro-card p-6">
        <div className="neuro-inset p-1 rounded-2xl bg-neuro-element mb-6">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="neuro-outset-sm p-2 rounded-xl">
                <Users className="h-5 w-5 text-neuro-accent" />
              </div>
              <h3 className="text-xl font-bold text-neuro-text-primary">Templates de Departamento/Setor</h3>
            </div>
            <Button
              onClick={() => setIsAddingDepartment(true)}
              disabled={isAddingDepartment}
              className="neuro-button text-neuro-text-primary font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>
        </div>

        <div className="neuro-inset p-6 rounded-2xl bg-neuro-element space-y-4">
          {/* Form for adding/editing department templates */}
          {isAddingDepartment && (
            <div className="neuro-inset p-6 rounded-2xl bg-neuro-surface space-y-4">
              <h4 className="font-semibold text-neuro-text-primary text-lg">
                {isEditingDepartment ? 'Editar Template' : 'Novo Template de Departamento'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-neuro-text-primary font-medium">Nome do Departamento *</Label>
                  <Input
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    placeholder="Ex: Segurança, Limpeza, Administração"
                    className="neuro-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-neuro-text-primary font-medium">Escala de Trabalho Padrão *</Label>
                  <Select
                    value={departmentForm.defaultWorkScale}
                    onValueChange={(value) => setDepartmentForm({ ...departmentForm, defaultWorkScale: value })}
                  >
                    <SelectTrigger className="neuro-input mt-1">
                      <SelectValue placeholder="Selecione uma escala" />
                    </SelectTrigger>
                    <SelectContent className="neuro-outset bg-neuro-surface border-0">
                      {workScales.map((scale) => (
                        <SelectItem key={scale.id} value={scale.id} className="neuro-hover">
                          <span className="text-neuro-text-primary">{scale.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-neuro-text-primary font-medium">Descrição</Label>
                <Textarea
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                  placeholder="Descreva as características deste departamento..."
                  rows={2}
                  className="neuro-input mt-1"
                />
              </div>

              <div>
                <Label className="text-neuro-text-primary font-medium">Turnos Padrão do Departamento</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {shiftTemplates.map((shift) => (
                    <label key={shift.id} className="flex items-center space-x-2 neuro-inset p-2 rounded-xl bg-neuro-element neuro-hover cursor-pointer">
                      <input
                        type="checkbox"
                        checked={departmentForm.defaultShifts?.includes(shift.id) || false}
                        onChange={(e) => {
                          const currentShifts = departmentForm.defaultShifts || [];
                          if (e.target.checked) {
                            setDepartmentForm({
                              ...departmentForm,
                              defaultShifts: [...currentShifts, shift.id]
                            });
                          } else {
                            setDepartmentForm({
                              ...departmentForm,
                              defaultShifts: currentShifts.filter(id => id !== shift.id)
                            });
                          }
                        }}
                        className="rounded neuro-input"
                      />
                      <span className="text-sm text-neuro-text-primary font-medium">{shift.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveDepartment} className="neuro-button text-neuro-text-primary font-semibold">
                  <Save className="h-4 w-4 mr-2" />
                  {isEditingDepartment ? 'Atualizar' : 'Salvar'} Template
                </Button>
                <Button onClick={handleCancelDepartment} className="neuro-button bg-neuro-error text-white font-semibold">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* List of department templates */}
          <div className="space-y-3">
            {departments.length === 0 ? (
              <div className="text-center py-8 text-neuro-text-muted">
                Nenhum template de departamento cadastrado.
              </div>
            ) : (
              departments.map((department) => (
                <div key={department.id} className="neuro-inset p-4 rounded-2xl bg-neuro-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-semibold text-neuro-text-primary">{department.name}</h4>
                        <div className="neuro-outset-sm px-3 py-1 rounded-xl bg-neuro-element mt-1 inline-block">
                          <span className="text-sm text-neuro-text-primary font-medium">
                            {workScales.find(ws => ws.id === department.defaultWorkScale)?.name || 'Escala não encontrada'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-neuro-text-secondary">
                        <p>{department.description}</p>
                        {department.defaultShifts.length > 0 && (
                          <p className="mt-1">
                            <span className="font-medium">Turnos:</span> {department.defaultShifts.map(shiftId =>
                              shiftTemplates.find(st => st.id === shiftId)?.name
                            ).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditDepartment(department)}
                        className="neuro-button text-neuro-text-primary font-semibold"
                        size="sm"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      {/* Migration Button Removed */}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      {companyProfile.name && (
        <div className="neuro-card p-6">
          <div className="neuro-inset p-1 rounded-2xl bg-neuro-element mb-6">
            <div className="flex items-center gap-3 p-4">
              <div className="neuro-outset-sm p-2 rounded-xl">
                <Palette className="h-5 w-5 text-neuro-accent" />
              </div>
              <h3 className="text-xl font-bold text-neuro-text-primary">Prévia do Sistema</h3>
            </div>
          </div>

          <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
            <div
              className="p-6 rounded-2xl neuro-outset-sm"
              style={{
                background: `linear-gradient(135deg, ${companyProfile.primaryColor}15, ${companyProfile.secondaryColor}15)`
              }}
            >
              <div className="flex items-center gap-4">
                {companyProfile.logo && (
                  <div className="neuro-outset-sm p-2 rounded-2xl">
                    <img
                      src={companyProfile.logo}
                      alt="Logo da empresa"
                      className="w-16 h-16 object-contain rounded-xl"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div>
                  <h3
                    className="text-2xl font-bold"
                    style={{ color: companyProfile.primaryColor }}
                  >
                    {companyProfile.name}
                  </h3>
                  <p
                    className="text-sm font-medium"
                    style={{ color: companyProfile.secondaryColor }}
                  >
                    Sistema de Gestão de Escalas
                  </p>
                  {companyProfile.description && (
                    <p className="text-sm mt-2 text-neuro-text-secondary">
                      {companyProfile.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySettings;
