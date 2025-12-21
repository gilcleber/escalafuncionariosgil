
// Hook utilitário para adicionar logs consistentes
import { useEffect } from 'react';

export const useDebug = (componentName: string, data: any) => {
  useEffect(() => {
    console.log(`[${componentName}] Debug data:`, data);
  }, [componentName, data]);
};

export default useDebug;
