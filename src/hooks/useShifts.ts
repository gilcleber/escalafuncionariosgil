// @ts-nocheck
import { useState, useEffect } from 'react';
import { Shift } from '@/types/employee';
import { supabase } from '@/integrations/supabase/client';
import { validateNewShift } from '@/utils/workRules';

export const useShifts = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchShifts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            const userId = user.id;

            // @ts-ignore
            const { data, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('user_id', userId);

            const shiftsData = (data as any) || [];

            if (error) throw error;

            const mappedShifts: Shift[] = shiftsData.map((s: any) => ({
                id: s.id,
                employeeId: s.employee_id,
                date: s.date,
                startTime: s.start_time.slice(0, 5), // '07:00:00' -> '07:00'
                endTime: s.end_time.slice(0, 5),
                type: s.type as Shift['type'],
                description: s.description || undefined
            }));

            setShifts(mappedShifts);
        } catch (error) {
            console.error('Error fetching shifts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const addShift = async (shift: Omit<Shift, 'id'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const userId = user.id;

        try {
            const payload = {
                user_id: userId,
                employee_id: shift.employeeId,
                date: shift.date,
                start_time: shift.startTime ? shift.startTime : null, // Send null if empty
                end_time: shift.endTime ? shift.endTime : null,       // Send null if empty
                type: shift.type,
                description: shift.description || ''
            };

            console.log('🚀 [addShift] Sending payload to Supabase:', payload);

            // @ts-ignore
            const { data, error } = await supabase
                .from('shifts')
                .insert([payload])
                .select()
                .single();

            if (error) {
                console.error('❌ [addShift] Supabase Error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log('✅ [addShift] Success:', data);

            const newShift: Shift = {
                id: data.id,
                employeeId: data.employee_id,
                date: data.date,
                startTime: data.start_time.slice(0, 5),
                endTime: data.end_time.slice(0, 5),
                type: data.type as Shift['type'],
                description: data.description || undefined
            };

            setShifts(prev => [...prev, newShift]);
        } catch (error: any) {
            console.error('🚨 [addShift] Catch Error:', error);
            alert(`Erro ao adicionar turno: ${error.message || 'Erro desconhecido'} (Verifique o console para detalhes)`);
        }
    };

    const updateShift = async (id: string, shift: Partial<Shift>) => {
        try {
            const updates: any = {};
            if (shift.startTime !== undefined) updates.start_time = shift.startTime ? shift.startTime : null;
            if (shift.endTime !== undefined) updates.end_time = shift.endTime ? shift.endTime : null;
            if (shift.type) updates.type = shift.type;
            if (shift.description !== undefined) updates.description = shift.description;
            if (shift.date) updates.date = shift.date;

            console.log('🚀 [updateShift] Sending updates for ID:', id, updates);

            // @ts-ignore
            const { error } = await supabase
                .from('shifts')
                .update(updates)
                .eq('id', id);

            if (error) {
                console.error('❌ [updateShift] Supabase Error:', error);
                throw error;
            }

            console.log('✅ [updateShift] Success');

            setShifts(prev => prev.map(s =>
                s.id === id ? { ...s, ...shift } : s
            ));
        } catch (error: any) {
            console.error('🚨 [updateShift] Catch Error:', error);
            alert(`Erro ao atualizar turno: ${error.message || 'Erro desconhecido'} (Verifique o console)`);
        }
    };

    const deleteShift = async (id: string) => {
        try {
            // @ts-ignore
            const { error } = await supabase
                .from('shifts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setShifts(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error('Error deleting shift:', error);
            alert('Erro ao remover turno.');
        }
    };

    // Keep the complex logic here but adapted
    const createShiftWithAutoEndTime = async (
        employeeId: string,
        date: string,
        startTime: string,
        type: Shift['type'],
        description?: string
    ) => {
        const endTime = startTime;

        // Validation needs existing shifts. We have them in `shifts` state.
        if (type === 'work') {
            const violations = validateNewShift(
                { employeeId, date, startTime, endTime },
                shifts
            );

            if (violations.length > 0) {
                alert(`ATENÇÃO - Violação de Interjornada:\n\n${violations.join('\n\n')}\n\nPor favor, ajuste os horários para respeitar o intervalo mínimo de 11 horas entre turnos.`);
                return;
            }
        }

        const existingShift = shifts.find(s => s.employeeId === employeeId && s.date === date);

        if (existingShift) {
            // Delete existing then Add new (or just Update?)
            // Update is cleaner if IDs are stable, but deleting ensures clean state.
            // Let's UPDATE if exists.
            await updateShift(existingShift.id, {
                startTime,
                endTime,
                type,
                description
            });
        } else {
            await addShift({
                employeeId,
                date,
                startTime,
                endTime,
                type,
                description
            });
        }
    };

    return {
        shifts,
        loadingShifts: loading,
        addShift,
        updateShift,
        deleteShift,
        createShiftWithAutoEndTime,
        refetchShifts: fetchShifts
    };
};
