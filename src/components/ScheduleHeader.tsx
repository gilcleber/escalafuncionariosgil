import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';

const ScheduleHeader: React.FC = () => {
  const { scheduleData, isSaving } = useSchedule();

  const stats = [
    {
      icon: Users,
      label: 'Funcionários',
      value: scheduleData.employees.length,
      color: 'bg-blue-500'
    },
    {
      icon: Calendar,
      label: 'Turnos Ativos',
      value: scheduleData.shifts.filter(s => s.type === 'work').length,
      color: 'bg-green-500'
    },
    {
      icon: Clock,
      label: 'Folgas',
      value: scheduleData.shifts.filter(s => s.type === 'dayoff').length,
      color: 'bg-yellow-500'
    },
    {
      icon: TrendingUp,
      label: 'Eventos',
      value: scheduleData.shifts.filter(s => s.type === 'event').length,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="flex justify-between items-center h-8">
        <div className="flex items-center gap-4">

          {isSaving && (
            <div className="flex items-center text-sm text-neuro-text-secondary animate-pulse">
              <span className="w-2 h-2 bg-neuro-warning rounded-full mr-2"></span>
              Salvando alterações...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4 hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleHeader;
