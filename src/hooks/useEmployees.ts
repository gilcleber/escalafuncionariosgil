import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { supabase } from '@/integrations/supabase/client';

export const useEmployees = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const getUserId = () => localStorage.getItem('schedule_installation_id');

    const fetchEmployees = async () => {
        try {
            const userId = getUserId();
            if (!userId) {
                setLoading(false);
                return;
            }

            // @ts-ignore
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('user_id', userId);

            // Cast data to any to avoid "excessively deep" error
            const typedData = (data as any) || [];

            if (error) throw error;

            const mappedEmployees: Employee[] = typedData.map((emp: any) => ({
                id: emp.id,
                name: emp.name,
                position: emp.position,
                defaultShift: emp.default_shift_template_id || '',
                active: emp.active
            }));

            setEmployees(mappedEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const addEmployee = async (employee: Omit<Employee, 'id'>) => {
        const userId = getUserId();
        if (!userId) return;

        try {
            // @ts-ignore
            const { data, error } = await supabase
                .from('employees')
                .insert([{
                    user_id: userId,
                    name: employee.name,
                    position: employee.position,
                    default_shift_template_id: employee.defaultShift || null,
                    active: true
                }])
                .select()
                .single();

            if (error) throw error;

            const newEmployee: Employee = {
                id: data.id,
                name: data.name,
                position: data.position,
                defaultShift: data.default_shift_template_id || ''
            };

            setEmployees(prev => [...prev, newEmployee]);
        } catch (error) {
            console.error('Error adding employee:', error);
            alert('Erro ao adicionar funcionário. Tente novamente.');
        }
    };

    const updateEmployee = async (id: string, employee: Partial<Employee>) => {
        try {
            const updates: any = {};
            if (employee.name) updates.name = employee.name;
            if (employee.position) updates.position = employee.position;
            if (employee.defaultShift !== undefined) updates.default_shift_template_id = employee.defaultShift || null;

            // @ts-ignore
            const { error } = await supabase
                .from('employees')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            setEmployees(prev => prev.map(emp =>
                emp.id === id ? { ...emp, ...employee } : emp
            ));
        } catch (error) {
            console.error('Error updating employee:', error);
            alert('Erro ao atualizar funcionário.');
        }
    };

    const deleteEmployee = async (id: string) => {
        try {
            // @ts-ignore
            const { error } = await supabase
                .from('employees')
                .update({ active: false }) // Soft delete
                .eq('id', id);

            if (error) throw error;

            setEmployees(prev => prev.filter(emp => emp.id !== id));
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Erro ao remover funcionário.');
        }
    };

    return {
        employees,
        loadingEmployees: loading,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        refetchEmployees: fetchEmployees
    };
};
