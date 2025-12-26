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

        // 2. DEEP CLEAN (REAL RESET - ID BASED)
        console.log("🔥 [IMPORT] Starting DEEP CLEAN (ID-Based)...");

        // A. Reset Settings
        const defaultSettings = createDefaultSettings();
        const { error: settingsError } = await supabase.from('profiles').upsert({
            id: userId,
            settings: defaultSettings,
            updated_at: new Date().toISOString()
        });
        if (settingsError) {
            console.error("❌ Error resetting settings:", settingsError);
            throw new Error("Failed to reset settings. Aborting.");
        }

        // C. Execute Deletion (Bulk via user_id - Standard & Safe)
        console.log(`🔥 [IMPORT] Executing Bulk Delete for User ID: ${userId}...`);

        // Helper to safe delete
        const safeDelete = async (table: string) => {
            // @ts-ignore
            const { error } = await supabase.from(table).delete().eq('user_id', userId);
            if (error) {
                console.error(`❌ [IMPORT ERROR] Failed to wipe ${table}:`, error);
                // Alert with full details
                const details = `Code: ${error.code}\nMsg: ${error.message}\nHint: ${error.hint}\nDetails: ${error.details}`;
                alert(`Erro detalhado ao limpar ${table}:\n${details}`);
                throw new Error(`Failed to wipe ${table}: ${error.message} (Code: ${error.code})`);
            }
        };

        await safeDelete('shifts');
        await safeDelete('employees');
        await safeDelete('events');
        await safeDelete('shift_templates');


        // D. Schedule Data Blob
        await supabase.from('schedule_data').delete().eq('id', 'main');

        // E. VERIFY EMPTY
        const { count: empCount } = await supabase.from('employees').select('id', { count: 'exact', head: true });
        if (empCount && empCount > 0) {
            console.warn("CRITICAL: Wipe failed. RLS likely blocking. Attempting fallback...");
            // Fallback: This confirms we can't delete them. But if we can't delete them, we can't 'fix' them.
            // But wait, if RLS blocked it, `shiftsDel` would likely be an error?
            // Not always. Some DBs return strict filters.
            throw new Error(`CRITICAL: Database wipe failed. ${empCount} employees remain. You may be viewing data you do not own and cannot delete.`);
        }

        console.log("✅ [IMPORT] Base Cleared Successfully. 0 Records.");


        // 3. DATA NORMALIZATION (Handle Legacy vs New Format)
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

        // 4. ID MAPPING & GENERATION
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

                // Validate Default Shift UUID (Fix for "invalid input syntax for type uuid")
                const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                const defaultShiftId = (emp.defaultShift && isUuid(emp.defaultShift)) ? emp.defaultShift : null;

                // 2. Map to DB Schema
                return {
                    id: emp.id,
                    user_id: userId,
                    name: emp.name,
                    position: emp.position,
                    default_shift_template_id: defaultShiftId, // SANITIZED UUID
                    active: isActive
                    // REMOVED end_date (Schema mismatch)
                    // REMOVED display_order (Schema mismatch)
                };
            });

            console.log("DEBUG v2: SAMPLE EMP PAYLOAD:", empPayload[0]);
            const { error: empError } = await supabase.from('employees').upsert(empPayload);
            if (empError) failures.push(`Employees: ${empError.message}`);
        }

        // E. Shifts
        if (shiftsList.length > 0) {
            const shiftsPayload = [];
            // Strict Filter: Valid IDs only (Foreign Key Protection)
            const validEmployeeIds = new Set(sanitizedEmployees.map(e => e.id));

            for (const s of shiftsList) {
                // Strict Filter 1: Missing times
                if (!s.startTime || s.startTime.trim() === '' || !s.endTime || s.endTime.trim() === '') {
                    continue; // IGNORE this shift
                }

                // Strict Filter 2: Unknown Employee
                if (!validEmployeeIds.has(s.employeeId)) {
                    console.warn(`DEBUG v2: SKIPPING SHIFT for Unknown ID ${s.employeeId}`);
                    continue; // IGNORE - Prevents FK Violation
                }

                shiftsPayload.push({
                    id: s.id,
                    user_id: userId,
                    employee_id: s.employeeId,
                    date: s.date,
                    type: s.type,
                    start_time: s.startTime,
                    end_time: s.endTime,
                    description: s.description
                });
            }

            if (shiftsPayload.length > 0) {
                const { error: shiftError } = await supabase.from('shifts').upsert(shiftsPayload);
                if (shiftError) failures.push(`Shifts: ${shiftError.message}`);
            }
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
