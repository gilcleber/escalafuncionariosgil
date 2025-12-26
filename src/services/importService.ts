// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { ScheduleData, Employee, Shift, ShiftTemplate, Event, ScheduleSettings } from '@/types/employee';
import { createDefaultSettings } from './scheduleService';

export const importBackupData = async (jsonData: any): Promise<{ success: boolean; message: string; failures: string[] }> => {
    const failures: string[] = [];

    try {
        // 1. Get Current User or Sign In Anonymously
        let { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.log("Usuário não logado. Tentando login anônimo...");
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

            if (anonError || !anonData.user) {
                console.error("Falha no login anônimo:", anonError);
                return {
                    success: false,
                    message: 'Erro de Autenticação: O sistema exige um usuário válido.\n\nSe o Login Anônimo não estiver ativado no Supabase, você precisará implementar o Login por Email.',
                    failures: [anonError?.message || 'Anonymous login returned no user']
                };
            }
            user = anonData.user;
        }

        const userId = user.id;

        // 2. Parse and Validate Data
        const data = jsonData as ScheduleData;

        // ID Mapping Maps
        const employeeIdMap = new Map<string, string>();

        // 3. Migrate Settings (Profile, Rules, Templates, Events)
        if (data.settings) {
            // A. Profile settings
            const settingsToSave = {
                companyProfile: data.settings.companyProfile,
                workRules: data.settings.workRules,
                employeeWorkRules: data.settings.employeeWorkRules,
                employeeRoutines: data.settings.employeeRoutines,
                workScales: data.settings.workScales
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    settings: settingsToSave,
                    updated_at: new Date().toISOString()
                });

            if (profileError) failures.push(`Settings/Profile: ${profileError.message}`);

            // B. Shift Templates
            if (data.settings.shiftTemplates && data.settings.shiftTemplates.length > 0) {
                for (const t of data.settings.shiftTemplates) {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id);
                    const newId = isUuid ? t.id : crypto.randomUUID();

                    const { error } = await supabase.from('shift_templates').upsert({
                        id: newId,
                        user_id: userId,
                        name: t.name,
                        start_time: t.startTime,
                        end_time: t.endTime,
                        color: t.color
                    });
                    if (error) failures.push(`Template ${t.name}: ${error.message}`);
                }
            }

            // C. Events
            const eventsList = [...(data.settings?.events || []), ...(data.settings?.holidays || [])];
            if (eventsList.length > 0) {
                for (const ev of eventsList) {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ev.id);
                    const newId = isUuid ? ev.id : crypto.randomUUID();

                    const { error } = await supabase.from('events').upsert({
                        id: newId,
                        user_id: userId,
                        name: ev.name,
                        date: ev.date,
                        type: ev.type === 'custom' ? 'custom_holiday' : 'company_event'
                    });
                    if (error) failures.push(`Event ${ev.name}: ${error.message}`);
                }
            }
        }

        // 4. Migrate Employees (Table: employees)
        if (data.employees && data.employees.length > 0) {
            // First pass: Generate new UUIDs for all employees
            for (const emp of data.employees) {
                // Store OLD ID for mapping
                const oldId = String(emp.id);
                const newId = crypto.randomUUID();

                employeeIdMap.set(oldId, newId); // Map OLD (string) -> NEW (uuid)

                // UPDATE JSON DATA IN PLACE (Crucial for Hybrid State)
                emp.id = newId;
            }

            const empPayload = data.employees.map(emp => ({
                id: emp.id, // This is now the NEW UUID
                user_id: userId,
                name: emp.name,
                position: emp.position,
                default_shift: emp.defaultShift,
                // Check multiple casing possibilities for active
                active: (emp as any).isActive ?? (emp as any).active ?? true,
                end_date: emp.endDate || null,
                display_order: emp.displayOrder || null
            }));

            const { error: empError } = await supabase.from('employees').upsert(empPayload);
            if (empError) {
                console.error("Employee Upsert Error:", empError);
                failures.push(`Employees: ${empError.message}`);
            }
        }

        // 5. Migrate Shifts (Table: shifts)
        // Handle both valid paths for shifts in JSON structure
        const shiftsList = data.data?.shifts || (data as any).shifts || [];

        if (shiftsList.length > 0) {
            const shiftsPayload = [];
            for (const s of shiftsList) {
                // s.employeeId is still the OLD ID ("1") here (we haven't updated shifts yet)
                const newEmpId = employeeIdMap.get(String(s.employeeId));

                if (newEmpId) {
                    // UPDATE JSON DATA IN PLACE (Crucial for Hybrid State)
                    s.employeeId = newEmpId;

                    shiftsPayload.push({
                        id: crypto.randomUUID(), // Generate new UUID for relational DB Shift
                        user_id: userId,
                        employee_id: newEmpId, // Use mapped Employee UUID
                        date: s.date,
                        type: s.type,
                        start_time: s.startTime,
                        end_time: s.endTime,
                        description: s.description
                    });
                } else {
                    console.warn(`Shift for unknown employee ${s.employeeId} skipped.`);
                }
            }

            if (shiftsPayload.length > 0) {
                // Batch upsert to Relational Table
                const { error: shiftError } = await supabase.from('shifts').upsert(shiftsPayload);
                if (shiftError) {
                    console.error("Shift Upsert Error:", shiftError);
                    failures.push(`Shifts: ${shiftError.message}`);
                }
            }
        }

        // 6. SAVE JSON BLOB (Legacy/Hybrid Support)
        // We save the MODIFIED variables (data) which now have UUIDs.
        try {
            const payload = {
                id: 'main',
                user_id: userId,
                data: JSON.stringify(data),
                updated_at: new Date().toISOString()
            };

            const { error: blobError } = await supabase
                .from('schedule_data')
                .upsert(payload);

            if (blobError) {
                console.error("JSON Blob Save Error:", blobError);
                failures.push(`JSON Blob: ${blobError.message}`);
            }
        } catch (e) {
            console.error("JSON Blob Save Exception:", e);
        }

        if (failures.length > 0) {
            return { success: false, message: 'Importação concluída com alguns erros. Verifique o console.', failures };
        }

        return { success: true, message: 'Dados importados com sucesso! Recarregue a página.', failures: [] };

    } catch (err: any) {
        console.error("Fatal Import Error:", err);
        return { success: false, message: `Erro fatal na importação: ${err.message}`, failures: [err.message] };
    }
};
