
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

  const getFilteredShifts = () => {
    return scheduleData.shifts.filter(shift => {
      // Parse YYYY-MM-DD string directly to avoid Timezone issues
      const [sYear, sMonth] = shift.date.split('-').map(Number);
      // selectedMonth is 0-indexed (0-11)
      // sMonth is 1-indexed (1-12)
      return (sMonth - 1) === selectedMonth && sYear === selectedYear;
    });
  };

  const generateSummaryReport = () => {
    const employees = scheduleData.employees;
    const shifts = getFilteredShifts();

    return {
      totalEmployees: employees.length,
      totalShifts: shifts.length,
      workDays: shifts.filter(s => s.type === 'work').length,
      dayOffs: shifts.filter(s => s.type === 'dayoff').length,
      vacations: shifts.filter(s => s.type === 'vacation').length,
      medicalLeaves: shifts.filter(s => s.type === 'medical').length,
      // Aggregates
      absences: shifts.filter(s => s.type === 'vacation' || s.type === 'medical').length
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
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #1e293b;
            background: #f8fafc;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          }
          h1 { 
            color: #0f172a; 
            text-align: center; 
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .header-info {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
          }
          .header-info p {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .stat-card {
            border: 1px solid #e2e8f0;
            padding: 25px;
            text-align: center;
            border-radius: 12px;
            background: #fff;
          }
          .stat-number {
            font-size: 2.5em;
            font-weight: 800;
            color: #3b82f6;
            line-height: 1;
          }
          .stat-label {
            margin-top: 10px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 0.8em;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
        </style>
        <div class="container">
          <h1>Relatório Mensal - ${monthName} / ${selectedYear}</h1>
          
          <div class="header-info">
            <p><strong>Mês de Referência:</strong> <span>${monthName} de ${selectedYear}</span></p>
            <p><strong>Tipo:</strong> <span>Resumo Geral de Escalas</span></p>
            <p><strong>Total de Funcionários:</strong> <span>${summary.totalEmployees}</span></p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number" style="color: #22c55e;">${summary.workDays}</div>
              <div class="stat-label">Dias Trabalhados</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: #eab308;">${summary.dayOffs}</div>
              <div class="stat-label">Folgas Regulares</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: #ef4444;">${summary.absences}</div>
              <div class="stat-label">Ausências (Férias/Atestados)</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: #64748b;">${summary.vacations}</div>
              <div class="stat-label">Férias Detalhado</div>
            </div>
          </div>

          <div class="footer">
            <p>Gerado automaticamente pelo Sistema de Escalas em ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Relatório - ${monthName} ${selectedYear}</title>
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
      // Generated CSV Logic also updated with safe parsing
      let csvContent = `Relatório Detalhado - ${monthName} ${selectedYear}\n\n`;

      if (reportType === 'detailed') {
        csvContent += 'Funcionário,Dias Trabalhados,Folgas,Férias,Atestados\n';
        scheduleData.employees.forEach((employee: any) => {
          const employeeShifts = scheduleData.shifts.filter(s => {
            const [sYear, sMonth] = s.date.split('-').map(Number);
            return s.employeeId === employee.id &&
              (sMonth - 1) === selectedMonth &&
              sYear === selectedYear;
          });

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

    // alert('Relatório exportado com sucesso!'); // Removed alert to be cleaner
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
                {/* <SelectItem value="hours" className="text-neuro-text-primary">Relatório de Horas</SelectItem> */}
                {/* <SelectItem value="absences" className="text-neuro-text-primary">Faltas e Ausências</SelectItem> */}
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
                    {format(new Date(2024, i, 1), 'MMMM', { locale: ptBR }).toUpperCase()}
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
          <p className="text-neuro-text-secondary font-medium uppercase text-xs tracking-wider">Funcionários</p>
        </div>

        <div className="neuro-card p-6 text-center">
          <div className="neuro-outset-sm p-4 rounded-2xl w-fit mx-auto mb-4">
            <Clock className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold text-neuro-text-primary mb-2">{summary.workDays}</h3>
          <p className="text-neuro-text-secondary font-medium uppercase text-xs tracking-wider">Dias Trabalhados</p>
        </div>

        <div className="neuro-card p-6 text-center">
          <div className="neuro-outset-sm p-4 rounded-2xl w-fit mx-auto mb-4">
            <CalendarIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-3xl font-bold text-neuro-text-primary mb-2">{summary.dayOffs}</h3>
          <p className="text-neuro-text-secondary font-medium uppercase text-xs tracking-wider">Folgas</p>
        </div>

        <div className="neuro-card p-6 text-center">
          <div className="neuro-outset-sm p-4 rounded-2xl w-fit mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-3xl font-bold text-neuro-text-primary mb-2">{summary.absences}</h3>
          <p className="text-neuro-text-secondary font-medium uppercase text-xs tracking-wider">Ausências</p>
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
                  <div className="text-sm text-neuro-text-secondary">Trabalho</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500 mb-1">{summary.dayOffs}</div>
                  <div className="text-sm text-neuro-text-secondary">Folgas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400 mb-1">{summary.vacations}</div>
                  <div className="text-sm text-neuro-text-secondary">Férias</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">{summary.medicalLeaves}</div>
                  <div className="text-sm text-neuro-text-secondary">Atestados</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'detailed' && (
          <div className="space-y-4">
            {scheduleData.employees.map((employee: any) => {
              const employeeShifts = getFilteredShifts().filter(s => s.employeeId === employee.id);
              return (
                <div key={employee.id} className="neuro-inset p-4 rounded-2xl bg-neuro-element hover:bg-neuro-surface transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h4 className="text-lg font-semibold text-neuro-text-primary min-w-[200px]">{employee.name}</h4>

                    <div className="grid grid-cols-4 gap-8 text-sm flex-1 w-full md:w-auto">
                      <div className="text-center">
                        <span className="block font-bold text-lg text-neuro-text-primary">{employeeShifts.filter(s => s.type === 'work').length}</span>
                        <span className="text-xs text-neuro-text-secondary uppercase">Trab</span>
                      </div>
                      <div className="text-center">
                        <span className="block font-bold text-lg text-neuro-text-primary">{employeeShifts.filter(s => s.type === 'dayoff').length}</span>
                        <span className="text-xs text-neuro-text-secondary uppercase">Folga</span>
                      </div>
                      <div className="text-center">
                        <span className="block font-bold text-lg text-neuro-text-primary">{employeeShifts.filter(s => s.type === 'vacation').length}</span>
                        <span className="text-xs text-neuro-text-secondary uppercase">Férias</span>
                      </div>
                      <div className="text-center">
                        <span className="block font-bold text-lg text-neuro-text-primary">{employeeShifts.filter(s => s.type === 'medical').length}</span>
                        <span className="text-xs text-neuro-text-secondary uppercase">Med</span>
                      </div>
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
