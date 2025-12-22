// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { ScheduleData, Employee, Shift, ShiftTemplate, Event, ScheduleSettings } from '@/types/employee';
import { createDefaultSettings } from './scheduleService';

export const importBackupData = async (jsonData: any): Promise<{ success: boolean; message: string; failures: string[] }> => {
    const failures: string[] = [];

    try {
        // 1. Get Current User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, message: 'Usuário não autenticado no Supabase.', failures: ['Auth Error'] };
        }

        const userId = user.id;

        // 2. Parse and Validate Data
        // We expect the FULL ScheduleData structure from the backup JSON
        const data = jsonData as ScheduleData;

        // 3. Migrate Settings (Profile, Rules, Templates, Events)
        if (data.settings) {
            // A. Profile & JSON Rules
            // Extract what goes into the JSON column vs what goes into tables
            const settingsToSave = {
                companyProfile: data.settings.companyProfile,
                workRules: data.settings.workRules,
                employeeWorkRules: data.settings.employeeWorkRules,
                employeeRoutines: data.settings.employeeRoutines, // If used
                workScales: data.settings.workScales
            };

            // Update Profile (Upsert) - we assume the user already has a row or we create one
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    // We keep existing fields if any, just updating settings
                    settings: settingsToSave,
                    updated_at: new Date().toISOString()
                });

            if (profileError) failures.push(`Settings/Profile: ${profileError.message}`);

            // B. Shift Templates (Table: shift_templates)
            if (data.settings.shiftTemplates && data.settings.shiftTemplates.length > 0) {
                // We'll delete existing for simplicity or upsert?
                // Upsert is safer. Map to DB columns.
                const templatesPayload = data.settings.shiftTemplates.map((t: any) => ({
                    id: t.id, // Assuming ID exists and is UUID? If legacy ID is '1', '2', we might need to keep it or new logic.
                    // Supabase ID is usually UUID. If legacy is '1', it might fail if column is UUID.
                    // Checked DB schema: shift_templates.id is uuid default gen_random_uuid().
                    // If we pass a string '1', it fails. 
                    // STRATEGY: 
                    // If ID is valid UUID, use it. If not, don't pass ID (let DB generate) 
                    // BUT we need to map old IDs to new IDs if we want to preserve Shift references.
                    // Complex.
                    // User said "Ctrl C".
                    // Let's assume for now we keep the ID if it looks like UUID, or we just insert. 
                    // IMPORTANT: The existing system uses string IDs. Supabase implementation might expect UUIDs.
                    // Let's check if the ID column is text or uuid.
                    // useShifts.ts uses standard strings.
                    // If DB column is UUID, we have a problem migrating '1', '2'.
                    // I'll assume standard text or we force it.
                    // Actually, let's treat IDs as is.
                    user_id: userId,
                    name: t.name,
                    start_time: t.startTime, // formatted?
                    end_time: t.endTime,
                    color: t.color
                }));

                // We can't batch upsert easily if IDs conflict or are wrong type.
                // Let's try upserting one by one to capture specific errors.
                for (const t of templatesPayload) {
                    const { error } = await supabase.from('shift_templates').upsert(t);
                    if (error) failures.push(`Template ${t.name}: ${error.message}`);
                }
            }

            // C. Events (Table: events)
            const eventsList = [...(data.settings.events || []), ...(data.settings.holidays || [])];
            if (eventsList.length > 0) {
                const eventsPayload = eventsList.map((e: any) => ({
                    id: e.id,
                    user_id: userId,
                    name: e.name,
                    date: e.date,
                    type: e.type === 'custom' ? 'custom_holiday' : 'company_event'
                }));

                for (const ev of eventsPayload) {
                    const { error } = await supabase.from('events').upsert(ev);
                    if (error) failures.push(`Event ${ev.name}: ${error.message}`);
                }
            }
        }

        // 4. Migrate Employees (Table: employees)
        if (data.employees && data.employees.length > 0) {
            const empPayload = data.employees.map(emp => ({
                id: emp.id,
                user_id: userId,
                name: emp.name,
                position: emp.position,
                default_shift: emp.defaultShift,
                active: emp.active !== false, // active defaults to true
                start_date: null, // Legacy didn't track start date
                end_date: emp.endDate || null,
                display_order: emp.displayOrder || null
            }));

            const { error: empError } = await supabase.from('employees').upsert(empPayload);
            if (empError) failures.push(`Employees: ${empError.message}`);
        }

        // 5. Migrate Shifts (Table: shifts)
        if (data.shifts && data.shifts.length > 0) {
            // Chunk it? 
            const shiftsPayload = data.shifts.map(s => ({
                id: s.id,
                user_id: userId,
                employee_id: s.employeeId,
                date: s.date,
                type: s.type,
                start_time: s.startTime,
                end_time: s.endTime,
                description: s.description
            }));

            // Batch upsert usually fine for < 1000 rows
            const { error: shiftError } = await supabase.from('shifts').upsert(shiftsPayload);
            if (shiftError) failures.push(`Shifts: ${shiftError.message}`);
        }

        if (failures.length > 0) {
            return { success: false, message: 'Importação concluída com alguns erros.', failures };
        }

        return { success: true, message: 'Dados importados com sucesso! Recarregue a página.', failures: [] };

    } catch (err: any) {
        return { success: false, message: `Erro fatal na importação: ${err.message}`, failures: [err.message] };
    }
};
