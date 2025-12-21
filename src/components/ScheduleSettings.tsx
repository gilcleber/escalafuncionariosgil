import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Building, Calendar, Clock, Users2, FileText } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import CompanySettings from './CompanySettings';
import UnifiedRules from './UnifiedRules';
import CustomWorkScales from './CustomWorkScales';
import EventsSettings from './EventsSettings';

const ScheduleSettings = () => {
  const { scheduleData, updateSettings } = useSchedule();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="neuro-card p-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="neuro-outset-sm p-4 rounded-2xl">
            <Settings className="h-8 w-8 text-neuro-accent" />
          </div>
          <h1 className="text-4xl font-bold text-neuro-text-primary">
            Configurações do Sistema
          </h1>
        </div>
        <p className="text-lg text-neuro-text-secondary">
          Configure as regras de trabalho, perfil da empresa e escalas personalizadas
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="neuro-card p-6">
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 neuro-outset bg-neuro-surface p-2 rounded-3xl">
            <TabsTrigger 
              value="company" 
              className="flex items-center gap-2 rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element data-[state=active]:text-neuro-text-primary text-neuro-text-secondary hover:text-neuro-text-primary font-medium"
            >
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Empresa</span>
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex items-center gap-2 rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element data-[state=active]:text-neuro-text-primary text-neuro-text-secondary hover:text-neuro-text-primary font-medium"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="work-rules" 
              className="flex items-center gap-2 rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element data-[state=active]:text-neuro-text-primary text-neuro-text-secondary hover:text-neuro-text-primary font-medium"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Regras</span>
            </TabsTrigger>
            <TabsTrigger 
              value="work-scales" 
              className="flex items-center gap-2 rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element data-[state=active]:text-neuro-text-primary text-neuro-text-secondary hover:text-neuro-text-primary font-medium"
            >
              <Users2 className="h-4 w-4" />
              <span className="hidden sm:inline">Escalas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-2 rounded-2xl transition-all duration-200 data-[state=active]:neuro-inset data-[state=active]:bg-neuro-element data-[state=active]:text-neuro-text-primary text-neuro-text-secondary hover:text-neuro-text-primary font-medium"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-6">
            <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
              <CompanySettings />
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
              <EventsSettings />
            </div>
          </TabsContent>

          <TabsContent value="work-rules" className="space-y-6">
            <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
              <UnifiedRules />
            </div>
          </TabsContent>

          <TabsContent value="work-scales" className="space-y-6">
            <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
              <CustomWorkScales />
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
              <ReportSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ReportSettings = () => {
  const [settings, setSettings] = useState({
    includeWeekends: true,
    includeHolidays: true,
    showHourlyDetails: true,
    exportFormat: 'pdf'
  });

  const handleExportReport = () => {
    // Implementar lógica de exportação
    const reportData = {
      settings,
      timestamp: new Date().toISOString(),
      reportType: 'configuration'
    };
    
    if (settings.exportFormat === 'pdf') {
      // Gerar PDF
      const htmlContent = `
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        </style>
        <h1>Relatório de Configurações</h1>
        <div class="section">
          <h2>Configurações de Relatório</h2>
          <p><strong>Incluir fins de semana:</strong> ${settings.includeWeekends ? 'Sim' : 'Não'}</p>
          <p><strong>Incluir feriados:</strong> ${settings.includeHolidays ? 'Sim' : 'Não'}</p>
          <p><strong>Mostrar detalhes por hora:</strong> ${settings.showHourlyDetails ? 'Sim' : 'Não'}</p>
          <p><strong>Formato de exportação:</strong> ${settings.exportFormat.toUpperCase()}</p>
        </div>
        <div class="section">
          <p><em>Relatório gerado em: ${new Date().toLocaleString('pt-BR')}</em></p>
        </div>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Relatório de Configurações</title>
            <meta charset="utf-8">
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } else {
      // Para outros formatos (CSV, Excel)
      const csvContent = `
Configuração,Valor
Incluir fins de semana,${settings.includeWeekends ? 'Sim' : 'Não'}
Incluir feriados,${settings.includeHolidays ? 'Sim' : 'Não'}
Mostrar detalhes por hora,${settings.showHourlyDetails ? 'Sim' : 'Não'}
Formato de exportação,${settings.exportFormat.toUpperCase()}
Data de geração,${new Date().toLocaleString('pt-BR')}
      `;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-configuracoes-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    
    alert('Relatório exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="neuro-outset-sm p-3 rounded-2xl">
          <FileText className="h-6 w-6 text-neuro-accent" />
        </div>
        <h2 className="text-2xl font-bold text-neuro-text-primary">Configurações de Relatórios</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="neuro-inset p-4 rounded-2xl bg-neuro-surface">
          <h3 className="text-lg font-semibold mb-4 text-neuro-text-primary">Conteúdo dos Relatórios</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={settings.includeWeekends}
                onChange={(e) => setSettings({...settings, includeWeekends: e.target.checked})}
                className="neuro-input w-4 h-4"
              />
              <span className="text-neuro-text-primary font-medium">Incluir fins de semana</span>
            </label>
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={settings.includeHolidays}
                onChange={(e) => setSettings({...settings, includeHolidays: e.target.checked})}
                className="neuro-input w-4 h-4"
              />
              <span className="text-neuro-text-primary font-medium">Incluir feriados</span>
            </label>
            <label className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={settings.showHourlyDetails}
                onChange={(e) => setSettings({...settings, showHourlyDetails: e.target.checked})}
                className="neuro-input w-4 h-4"
              />
              <span className="text-neuro-text-primary font-medium">Mostrar detalhes por hora</span>
            </label>
          </div>
        </div>

        <div className="neuro-inset p-4 rounded-2xl bg-neuro-surface">
          <h3 className="text-lg font-semibold mb-4 text-neuro-text-primary">Formato de Exportação</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input 
                type="radio" 
                name="exportFormat"
                value="pdf"
                checked={settings.exportFormat === 'pdf'}
                onChange={(e) => setSettings({...settings, exportFormat: e.target.value})}
                className="neuro-input w-4 h-4"
              />
              <span className="text-neuro-text-primary font-medium">PDF</span>
            </label>
            <label className="flex items-center gap-3">
              <input 
                type="radio" 
                name="exportFormat"
                value="excel"
                checked={settings.exportFormat === 'excel'}
                onChange={(e) => setSettings({...settings, exportFormat: e.target.value})}
                className="neuro-input w-4 h-4"
              />
              <span className="text-neuro-text-primary font-medium">Excel</span>
            </label>
            <label className="flex items-center gap-3">
              <input 
                type="radio" 
                name="exportFormat"
                value="csv"
                checked={settings.exportFormat === 'csv'}
                onChange={(e) => setSettings({...settings, exportFormat: e.target.value})}
                className="neuro-input w-4 h-4"
              />
              <span className="text-neuro-text-primary font-medium">CSV</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleExportReport}
          className="neuro-button text-neuro-text-primary font-semibold"
        >
          Exportar Relatório
        </Button>
      </div>
    </div>
  );
};

export default ScheduleSettings;
