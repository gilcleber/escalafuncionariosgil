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

        // 2. DATA NORMALIZATION (Handle Legacy vs New Format)
        const rawData = jsonData as any;

        // Legacy: { version: "1.0", data: { employees: [], shifts: [], ... } }
        const isLegacyFormat = rawData.data && (Array.isArray(rawData.data.employees) || Array.isArray(rawData.data.shifts));
        const rootData = isLegacyFormat ? rawData.data : rawData;

        // Extract Lists with Fallbacks
        let employeesList = rootData.employees || [];
        // Legacy often has shifts in data.shifts, but let's be robust
        let shiftsList = rootData.shifts || (rootData.data && rootData.data.shifts) || [];

        // Extract Settings
        const settingsData = rootData.settings || {};
        // Merge top-level legacy settings into settings object if missing
        if (!settingsData.companyProfile && rootData.companyProfile) settingsData.companyProfile = rootData.companyProfile;
        if (!settingsData.employeeWorkRules && rootData.employeeWorkRules) settingsData.employeeWorkRules = rootData.employeeWorkRules;
        if (!settingsData.employeeRoutines && rootData.employeeRoutines) settingsData.employeeRoutines = rootData.employeeRoutines;
        if (!settingsData.events && rootData.events && Array.isArray(rootData.events)) settingsData.events = rootData.events; // Sometimes events are at root

        // 3. ID MAPPING & GENERATION
        const employeeIdMap = new Map<string, string>();

        // Process Employees (Generate UUIDs)
        if (employeesList.length > 0) {
            for (const emp of employeesList) {
                const oldId = String(emp.id);
                const newId = crypto.randomUUID();
                employeeIdMap.set(oldId, newId);
                emp.id = newId; // Update in-place
            }
        }

        // Process Shifts (Map to new Employee IDs)
        const validShifts = [];
        for (const s of shiftsList) {
            const oldEmpId = String(s.employeeId);
            const newEmpId = employeeIdMap.get(oldEmpId);

            if (newEmpId) {
                s.employeeId = newEmpId; // Update in-place
                s.id = crypto.randomUUID(); // New UUID
                validShifts.push(s);
            }
        }
        shiftsList = validShifts;

        // 4. RELATIONAL UPSERTS

        // A. Profile & Settings
        const settingsToSave = {
            companyProfile: settingsData.companyProfile || createDefaultSettings().companyProfile,
            workRules: settingsData.workRules || createDefaultSettings().workRules,
            employeeWorkRules: settingsData.employeeWorkRules || [],
            employeeRoutines: settingsData.employeeRoutines || [],
            workScales: settingsData.workScales || createDefaultSettings().workScales
        };

        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            settings: settingsToSave,
            updated_at: new Date().toISOString()
        });
        if (profileError) failures.push(`Profile: ${profileError.message}`);

        // B. Shift Templates
        if (settingsData.shiftTemplates?.length > 0) {
            for (const t of settingsData.shiftTemplates) {
                const isUuid = /^[0-9a-f-]{36}$/i.test(t.id);
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
        const eventsList = [...(settingsData.events || []), ...(settingsData.holidays || [])];
        if (eventsList.length > 0) {
            for (const ev of eventsList) {
                const isUuid = /^[0-9a-f-]{36}$/i.test(ev.id);
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

        // D. Employees
        const sanitizedEmployees: Employee[] = [];
        if (employeesList.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const empPayload = employeesList.map((emp: any) => {
                // 1. Determine Status
                let isActive = emp.isActive ?? emp.active ?? true;
                const endDate = emp.endDate ? new Date(emp.endDate) : null;
                const name = emp.name || '';

                // Force inactive if end date is in the past
                if (endDate && endDate < today) {
                    isActive = false;
                }

                // Force inactive if Fake/Test
                if (name.toUpperCase().includes('FAKE') || name.toUpperCase().includes('TESTE')) {
                    isActive = false;
                }

                // Update the object in list for JSON saving too
                emp.active = isActive;
                emp.isActive = isActive;

                sanitizedEmployees.push(emp);

                // 2. Map to DB Schema
                return {
                    id: emp.id,
                    user_id: userId,
                    name: emp.name,
                    position: emp.position,
                    default_shift_template_id: emp.defaultShift, // CORRECTED COLUMN NAME
                    active: isActive,
                    end_date: emp.endDate || null,
                    display_order: emp.displayOrder || null
                };
            });

            const { error: empError } = await supabase.from('employees').upsert(empPayload);
            if (empError) failures.push(`Employees: ${empError.message}`);
        }

        // E. Shifts
        // Helper to handle empty time strings for Supabase time type
        const sanitizeTime = (t: string | null | undefined) => (!t || t.trim() === '') ? null : t;

        if (shiftsList.length > 0) {
            const shiftsPayload = shiftsList.map((s: any) => ({
                id: s.id,
                user_id: userId,
                employee_id: s.employeeId,
                date: s.date,
                type: s.type,
                start_time: sanitizeTime(s.startTime),
                end_time: sanitizeTime(s.endTime),
                description: s.description
            }));
            const { error: shiftError } = await supabase.from('shifts').upsert(shiftsPayload);
            if (shiftError) failures.push(`Shifts: ${shiftError.message}`);
        }

        // 5. SAVE JSON BLOB (Converted to NEW Format & Sanitized)
        const cleanData: ScheduleData = {
            employees: sanitizedEmployees, // Use the sanitized list
            shifts: shiftsList,
            settings: settingsData,
            month: rootData.month || new Date().getMonth(),
            year: rootData.year || new Date().getFullYear()
        };

        try {
            const payload = {
                id: 'main',
                // user_id removed to fix schema error
                data: JSON.stringify(cleanData),
                updated_at: new Date().toISOString()
            };
            const { error: blobError } = await supabase.from('schedule_data').upsert(payload);
            if (blobError) failures.push(`JSON Blob: ${blobError.message}`);
        } catch (e: any) {
            failures.push(`JSON Save: ${e.message}`);
        }

        if (failures.length > 0) {
            return { success: false, message: 'Importação com avisos. Verifique console.', failures };
        }
        return { success: true, message: 'Dados importados e convertidos com sucesso!', failures: [] };
    } catch (err: any) {
        console.error("Fatal Import Error:", err);
        return { success: false, message: `Erro fatal na importação: ${err.message}`, failures: [err.message] };
    }
};
