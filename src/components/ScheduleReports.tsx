
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Download, FileText, BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ScheduleReports = () => {
  const { scheduleData } = useSchedule();
  const [selectedMonth, setSelectedMonth] = useState(scheduleData.month);
  const [selectedYear, setSelectedYear] = useState(scheduleData.year);
  const [reportType, setReportType] = useState('summary');

  const generateSummaryReport = () => {
    const employees = scheduleData.employees;
    const shifts = scheduleData.shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate.getMonth() === selectedMonth && shiftDate.getFullYear() === selectedYear;
    });

    return {
      totalEmployees: employees.length,
      totalShifts: shifts.length,
      workDays: shifts.filter(s => s.type === 'work').length,
      dayOffs: shifts.filter(s => s.type === 'dayoff').length,
      vacations: shifts.filter(s => s.type === 'vacation').length,
      medicalLeaves: shifts.filter(s => s.type === 'medical').length
    };
  };

  const handleExportReport = () => {
    const summary = generateSummaryReport();
    const monthName = format(new Date(selectedYear, selectedMonth, 1), 'MMMM', { locale: ptBR });
    
    if (reportType === 'summary') {
      // Gerar relatório em HTML para impressão
      const htmlContent = `
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
          }
          h1 { 
            color: #4f82bd; 
            text-align: center; 
            border-bottom: 2px solid #4f82bd;
            padding-bottom: 10px;
          }
          .header-info {
            text-align: center;
            margin: 20px 0;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .stat-card {
            border: 1px solid #ddd;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            background: #fff;
          }
          .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #4f82bd;
          }
          .stat-label {
            margin-top: 10px;
            color: #666;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-style: italic;
            color: #888;
          }
        </style>
        <h1>Relatório de Escalas - ${monthName} ${selectedYear}</h1>
        
        <div class="header-info">
          <p><strong>Período:</strong> ${monthName} de ${selectedYear}</p>
          <p><strong>Tipo de Relatório:</strong> Resumo Geral</p>
          <p><strong>Total de Funcionários:</strong> ${summary.totalEmployees}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${summary.workDays}</div>
            <div class="stat-label">Dias de Trabalho</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${summary.dayOffs}</div>
            <div class="stat-label">Folgas</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${summary.vacations}</div>
            <div class="stat-label">Férias</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${summary.medicalLeaves}</div>
            <div class="stat-label">Atestados Médicos</div>
          </div>
        </div>

        <div class="footer">
          <p>Relatório gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Relatório de Escalas - ${monthName} ${selectedYear}</title>
            <meta charset="utf-8">
          </head>
          <body>
            ${htmlContent}
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      // Para outros tipos de relatório, gerar CSV
      let csvContent = `Relatório Detalhado - ${monthName} ${selectedYear}\n\n`;
      
      if (reportType === 'detailed') {
        csvContent += 'Funcionário,Dias Trabalhados,Folgas,Férias,Atestados\n';
        scheduleData.employees.forEach((employee: any) => {
          const employeeShifts = scheduleData.shifts.filter(s => 
            s.employeeId === employee.id &&
            new Date(s.date).getMonth() === selectedMonth &&
            new Date(s.date).getFullYear() === selectedYear
          );
          
          const workDays = employeeShifts.filter(s => s.type === 'work').length;
          const dayOffs = employeeShifts.filter(s => s.type === 'dayoff').length;
          const vacations = employeeShifts.filter(s => s.type === 'vacation').length;
          const medicalLeaves = employeeShifts.filter(s => s.type === 'medical').length;
          
          csvContent += `${employee.name},${workDays},${dayOffs},${vacations},${medicalLeaves}\n`;
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-escalas-${monthName}-${selectedYear}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    
    alert('Relatório exportado com sucesso!');
  };

  const summary = generateSummaryReport();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="neuro-card p-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="neuro-outset-sm p-4 rounded-2xl">
            <BarChart3 className="h-8 w-8 text-neuro-accent" />
          </div>
          <h1 className="text-4xl font-bold text-neuro-text-primary">
            Relatórios e Análises
          </h1>
        </div>
        <p className="text-lg text-neuro-text-secondary">
          Visualize estatísticas e gere relatórios detalhados das escalas
        </p>
      </div>

      {/* Report Controls */}
      <div className="neuro-card p-6">
        <h2 className="text-2xl font-bold mb-6 text-neuro-text-primary">Filtros do Relatório</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neuro-text-primary mb-2">Tipo de Relatório</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="neuro-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="neuro-card border-0">
                <SelectItem value="summary" className="text-neuro-text-primary">Resumo Geral</SelectItem>
                <SelectItem value="detailed" className="text-neuro-text-primary">Detalhado por Funcionário</SelectItem>
                <SelectItem value="hours" className="text-neuro-text-primary">Relatório de Horas</SelectItem>
                <SelectItem value="absences" className="text-neuro-text-primary">Faltas e Ausências</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neuro-text-primary mb-2">Mês</label>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="neuro-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="neuro-card border-0">
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()} className="text-neuro-text-primary">
                    {format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neuro-text-primary mb-2">Ano</label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="neuro-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="neuro-card border-0">
                {[2023, 2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()} className="text-neuro-text-primary">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleExportReport} className="w-full neuro-button text-neuro-text-primary font-semibold">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="neuro-card p-6 text-center">
          <div className="neuro-outset-sm p-4 rounded-2xl w-fit mx-auto mb-4">
            <Users className="h-8 w-8 text-neuro-accent" />
          </div>
          <h3 className="text-3xl font-bold text-neuro-text-primary mb-2">{summary.totalEmployees}</h3>
          <p className="text-neuro-text-secondary font-medium">Total de Funcionários</p>
        </div>

        <div className="neuro-card p-6 text-center">
          <div className="neuro-outset-sm p-4 rounded-2xl w-fit mx-auto mb-4">
            <Clock className="h-8 w-8 text-neuro-success" />
          </div>
          <h3 className="text-3xl font-bold text-neuro-text-primary mb-2">{summary.workDays}</h3>
          <p className="text-neuro-text-secondary font-medium">Dias Trabalhados</p>
        </div>

        <div className="neuro-card p-6 text-center">
          <div className="neuro-outset-sm p-4 rounded-2xl w-fit mx-auto mb-4">
            <CalendarIcon className="h-8 w-8 text-neuro-warning" />
          </div>
          <h3 className="text-3xl font-bold text-neuro-text-primary mb-2">{summary.dayOffs}</h3>
          <p className="text-neuro-text-secondary font-medium">Folgas</p>
        </div>

        <div className="neuro-card p-6 text-center">
          <div className="neuro-outset-sm p-4 rounded-2xl w-fit mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-neuro-error" />
          </div>
          <h3 className="text-3xl font-bold text-neuro-text-primary mb-2">{summary.vacations + summary.medicalLeaves}</h3>
          <p className="text-neuro-text-secondary font-medium">Ausências</p>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="neuro-card p-6">
        <h2 className="text-2xl font-bold mb-6 text-neuro-text-primary">Relatório Detalhado</h2>
        
        {reportType === 'summary' && (
          <div className="space-y-6">
            <div className="neuro-inset p-6 rounded-2xl bg-neuro-element">
              <h3 className="text-lg font-semibold mb-4 text-neuro-text-primary">Resumo do Período</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neuro-accent mb-1">{summary.workDays}</div>
                  <div className="text-sm text-neuro-text-secondary">Dias de Trabalho</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neuro-warning mb-1">{summary.dayOffs}</div>
                  <div className="text-sm text-neuro-text-secondary">Folgas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neuro-success mb-1">{summary.vacations}</div>
                  <div className="text-sm text-neuro-text-secondary">Férias</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neuro-error mb-1">{summary.medicalLeaves}</div>
                  <div className="text-sm text-neuro-text-secondary">Atestados</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'detailed' && (
          <div className="space-y-4">
            {scheduleData.employees.map((employee: any) => {
              const employeeShifts = scheduleData.shifts.filter(s => s.employeeId === employee.id);
              return (
                <div key={employee.id} className="neuro-inset p-4 rounded-2xl bg-neuro-element">
                  <h4 className="text-lg font-semibold text-neuro-text-primary mb-2">{employee.name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-neuro-text-secondary">Trabalho: </span>
                      <span className="font-semibold text-neuro-text-primary">
                        {employeeShifts.filter(s => s.type === 'work').length} dias
                      </span>
                    </div>
                    <div>
                      <span className="text-neuro-text-secondary">Folgas: </span>
                      <span className="font-semibold text-neuro-text-primary">
                        {employeeShifts.filter(s => s.type === 'dayoff').length} dias
                      </span>
                    </div>
                    <div>
                      <span className="text-neuro-text-secondary">Férias: </span>
                      <span className="font-semibold text-neuro-text-primary">
                        {employeeShifts.filter(s => s.type === 'vacation').length} dias
                      </span>
                    </div>
                    <div>
                      <span className="text-neuro-text-secondary">Atestados: </span>
                      <span className="font-semibold text-neuro-text-primary">
                        {employeeShifts.filter(s => s.type === 'medical').length} dias
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleReports;
