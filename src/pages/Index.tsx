import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduleProvider } from '@/contexts/ScheduleContextSupabase';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import EmployeeManager from '@/components/EmployeeManager';
import ScheduleHeader from '@/components/ScheduleHeader';
import ScheduleSettings from '@/components/ScheduleSettings';
import ScheduleReports from '@/components/ScheduleReports';
import { Calendar, Users, Settings, BarChart3 } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';

// Componente para preview do perfil da empresa com design neuromórfico
const CompanyPreview: React.FC = () => {
  const { scheduleData } = useSchedule();
  const companyProfile = scheduleData?.settings?.companyProfile;

  if (!companyProfile?.name) {
    return (
      <div className="text-center mb-12">
        <div className="neuro-card p-8 mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold text-neuro-text-primary mb-4">
            Sistema de Controle de Escalas
          </h1>
          <p className="text-xl text-neuro-text-secondary">
            Gerencie facilmente as escalas de trabalho dos seus funcionários
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center mb-12">
      <div className="neuro-card p-8 mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-6">
          {companyProfile.logo && (
            <div className="neuro-outset-sm rounded-2xl p-4">
              <img
                src={companyProfile.logo}
                alt="Logo da empresa"
                className="w-20 h-20 object-contain rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div>
            <h1 className="text-5xl font-bold mb-3 text-neuro-text-primary">
              {companyProfile.name}
            </h1>
            <p className="text-xl text-neuro-accent mb-2">
              Sistema de Gestão de Escalas
            </p>
            {companyProfile.description && (
              <p className="text-sm mt-3 text-neuro-text-muted">
                {companyProfile.description}
              </p>
            )}
          </div>
        </div>
      </div>
      <p className="text-lg text-neuro-text-secondary mt-6">
        Gerencie facilmente as escalas de trabalho dos seus funcionários
      </p>
    </div>
  );
};

// Componente principal com provider
const IndexContent = () => {
  const { isLoading } = useSchedule();
  // Check if we're in view-only mode
  const isViewOnly = new URLSearchParams(window.location.search).get('view') === 'only';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neuro-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neuro-accent mx-auto mb-4"></div>
          <p className="text-neuro-text-secondary">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neuro-bg">
      <div className="container mx-auto px-6 py-12">
        {/* Header com preview da empresa */}
        <CompanyPreview />

        {/* Stats Cards - Only show in edit mode */}
        {!isViewOnly && <ScheduleHeader />}

        {/* Main Content */}
        {isViewOnly ? (
          // View-only mode: Show only calendar
          <div className="w-full">
            <ScheduleCalendar />
          </div>
        ) : (
          // Edit mode: Show full interface with tabs
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 neuro-outset bg-neuro-surface p-2 rounded-3xl">
              <TabsTrigger
                value="calendar"
                className="flex items-center gap-2 rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element text-neuro-text-primary"
              >
                <Calendar className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Calendário</span>
              </TabsTrigger>
              <TabsTrigger
                value="employees"
                className="flex items-center gap-2 rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element text-neuro-text-primary"
              >
                <Users className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Funcionários</span>
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="flex items-center gap-2 rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element text-neuro-text-primary"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Relatórios</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element text-neuro-text-primary"
              >
                <Settings className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Configurações</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-8">
              <ScheduleCalendar />
            </TabsContent>

            <TabsContent value="employees" className="space-y-8">
              <EmployeeManager />
            </TabsContent>

            <TabsContent value="reports" className="space-y-8">
              <ScheduleReports />
            </TabsContent>

            <TabsContent value="settings" className="space-y-8">
              <ScheduleSettings />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <ScheduleProvider>
      <IndexContent />
    </ScheduleProvider>
  );
};

export default Index;
