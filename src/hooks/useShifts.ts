// @ts-nocheck
import { useState, useEffect } from 'react';
import { Shift } from '@/types/employee';
import { supabase } from '@/integrations/supabase/client';
import { validateNewShift } from '@/utils/workRules';

export const useShifts = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);

    const getUserId = () => localStorage.getItem('schedule_installation_id');

    const fetchShifts = async () => {
        try {
            const userId = getUserId();
            if (!userId) {
                setLoading(false);
                return;
            }

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
        const userId = getUserId();
        if (!userId) return;

        try {
            // @ts-ignore
            const { data, error } = await supabase
                .from('shifts')
                .insert([{
                    user_id: userId,
                    employee_id: shift.employeeId,
                    date: shift.date,
                    start_time: shift.startTime,
                    end_time: shift.endTime,
                    type: shift.type,
                    description: shift.description || ''
                }])
                .select()
                .single();

            if (error) throw error;

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
        } catch (error) {
            console.error('Error adding shift:', error);
            alert('Erro ao adicionar turno.');
        }
    };

    const updateShift = async (id: string, shift: Partial<Shift>) => {
        try {
            const updates: any = {};
            if (shift.startTime) updates.start_time = shift.startTime;
            if (shift.endTime) updates.end_time = shift.endTime;
            if (shift.type) updates.type = shift.type;
            if (shift.description !== undefined) updates.description = shift.description;
            if (shift.date) updates.date = shift.date;

            // @ts-ignore
            const { error } = await supabase
                .from('shifts')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            setShifts(prev => prev.map(s =>
                s.id === id ? { ...s, ...shift } : s
            ));
        } catch (error) {
            console.error('Error updating shift:', error);
            alert('Erro ao atualizar turno.');
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
        createShiftWithAutoEndTime
    };
};
