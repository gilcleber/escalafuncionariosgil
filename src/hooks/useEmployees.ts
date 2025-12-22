// @ts-nocheck
import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { supabase } from '@/integrations/supabase/client';

export const useEmployees = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEmployees = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            const userId = user.id;


            // @ts-ignore
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                // .eq('user_id', userId) // RLS handles this usually but we keep it safe? user_id is implicit in RLS but precise.
                // .order('display_order', { ascending: true }) // Removing to fix crash
                .order('name', { ascending: true });

            // Cast data to any to avoid "excessively deep" error
            const typedData = (data as any) || [];

            if (error) throw error;

            const mappedEmployees: Employee[] = typedData.map((emp: any) => ({
                id: emp.id,
                name: emp.name,
                position: emp.position,
                defaultShift: emp.default_shift_template_id || '',
                active: emp.active,
                endDate: emp.end_date,
                displayOrder: emp.display_order
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const userId = user.id;

        try {
            // Calculate next display order
            const maxOrder = employees.reduce((max, e) => Math.max(max, e.displayOrder || 0), 0);

            // @ts-ignore
            const { data, error } = await supabase
                .from('employees')
                .insert([{
                    user_id: userId,
                    name: employee.name,
                    position: employee.position,
                    default_shift_template_id: employee.defaultShift || null,
                    active: true,
                    // display_order: maxOrder + 1 // Removing to fix crash
                }])
                .select()
                .single();

            if (error) throw error;

            const newEmployee: Employee = {
                id: data.id,
                name: data.name,
                position: data.position,
                defaultShift: data.default_shift_template_id || '',
                active: true,
                displayOrder: data.display_order
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
            // if (employee.defaultShift !== undefined) updates.default_shift_template_id = employee.defaultShift || null;
            // if (employee.displayOrder !== undefined) updates.display_order = employee.displayOrder; // Removing to fix crash

            if (employee.defaultShift !== undefined) updates.default_shift_template_id = employee.defaultShift || null;

            // RLS handles user check, but good to be explicit or just call update
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
                .delete()
                .eq('id', id);

            if (error) throw error;

            setEmployees(prev => prev.filter(emp => emp.id !== id));
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Erro ao remover funcionário.');
        }
    };

    const archiveEmployee = async (id: string, date: string) => {
        try {
            // @ts-ignore
            const { error } = await supabase
                .from('employees')
                .update({
                    active: false,
                    end_date: date
                })
                .eq('id', id);

            if (error) throw error;

            setEmployees(prev => prev.map(emp =>
                emp.id === id ? { ...emp, active: false, endDate: date } : emp
            ));
        } catch (error) {
            console.error('Error archiving employee:', error);
            alert('Erro ao arquivar funcionário.');
        }
    };

    const restoreEmployee = async (id: string) => {
        try {
            // @ts-ignore
            const { error } = await supabase
                .from('employees')
                .update({
                    active: true,
                    end_date: null
                })
                .eq('id', id);

            if (error) throw error;

            setEmployees(prev => prev.map(emp =>
                emp.id === id ? { ...emp, active: true, endDate: null } : emp
            ));
        } catch (error) {
            console.error('Error restoring employee:', error);
            alert('Erro ao restaurar funcionário.');
        }
    };

    const reorderEmployees = async (items: { id: string; displayOrder: number }[]) => {
        console.warn("Reorder disabled: Missing display_order column.");
        // NO-OP to prevent crash
    };

    return {
        employees,
        loadingEmployees: loading,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        archiveEmployee,
        restoreEmployee,
        reorderEmployees,
        refetchEmployees: fetchEmployees
    };
};
