
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Grid3x3 } from 'lucide-react';

export type CalendarViewType = 'weekly' | 'compact';

interface CalendarViewSelectorProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  isEmployeeOrViewOnly?: boolean;
}

const CalendarViewSelector: React.FC<CalendarViewSelectorProps> = ({
  currentView,
  onViewChange,
  isEmployeeOrViewOnly = false
}) => {
  if (isEmployeeOrViewOnly) {
    return null; // Não mostra seletor para funcionários
  }

  return (
    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
      <span className="text-sm font-medium text-gray-600">Visualização:</span>
      
      <Button
        variant={currentView === 'weekly' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('weekly')}
        className="flex items-center gap-1"
      >
        <Grid3x3 className="h-4 w-4" />
        Semanal
      </Button>
      
      <Button
        variant={currentView === 'compact' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('compact')}
        className="flex items-center gap-1"
      >
        <Calendar className="h-4 w-4" />
        Compacto
      </Button>
    </div>
  );
};

export default CalendarViewSelector;
