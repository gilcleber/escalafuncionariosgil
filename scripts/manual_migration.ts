
import { createClient } from '@supabase/supabase-js';

// Credentials from client.ts
const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Types (Simplified for script)
interface ScheduleData {
    settings: any;
    employees: any[];
    shifts: any[];
}

const executeMigration = async (currentData: ScheduleData, userId: string) => {
    const failures: string[] = [];
    console.log(`🚀 Starting Migration for User: ${userId}`);

    try {
        // 1. MIGRATE PROFILE & SETTINGS
        console.log('📦 Migrating Profile Settings...');
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                name: 'My Company',
                settings: {
                    workRules: currentData.settings.workRules,
                    workScales: currentData.settings.workScales,
                    employeeWorkRules: currentData.settings.employeeWorkRules,
                    employeeRoutines: currentData.settings.employeeRoutines,
                    companyProfile: currentData.settings.companyProfile,
                    departmentTemplates: currentData.settings.departmentTemplates,
                    holidays: currentData.settings.holidays?.filter((h: any) => h.type === 'national')
                }
            });

        if (profileError) console.error('Profile Error:', profileError.message);

        // 2. MIGRATE SHIFT TEMPLATES
        console.log('📋 Migrating Shift Templates...');
        const templateIdMap = new Map<string, string>();
        if (currentData.settings.shiftTemplates) {
            for (const template of currentData.settings.shiftTemplates) {
                const { data: insertedTemplate, error: templateError } = await supabase
                    .from('shift_templates')
                    .insert({
                        user_id: userId,
                        name: template.name,
                        start_time: template.startTime,
                        end_time: template.endTime,
                        color: template.color
                    })
                    .select()
                    .single();

                if (templateError) failures.push(`Template "${template.name}": ${templateError.message}`);
                else if (insertedTemplate) templateIdMap.set(template.id, insertedTemplate.id);
            }
        }

        // 3. MIGRATE EMPLOYEES
        console.log('👥 Migrating Employees...');
        const employeeIdMap = new Map<string, string>();
        for (const emp of currentData.employees) {
            const newTemplateId = emp.defaultShift ? templateIdMap.get(emp.defaultShift) : null;
            const { data: insertedEmployee, error: empError } = await supabase
                .from('employees')
                .insert({
                    user_id: userId,
                    name: emp.name,
                    position: emp.position,
                    default_shift_template_id: newTemplateId,
                    active: true
                })
                .select()
                .single();

            if (empError) failures.push(`Employee "${emp.name}": ${empError.message}`);
            else if (insertedEmployee) employeeIdMap.set(emp.id, insertedEmployee.id);
        }

        // 4. MIGRATE SHIFTS
        console.log('📅 Migrating Shifts...');
        const validShifts = currentData.shifts.filter(s => employeeIdMap.has(s.employeeId));
        const shiftsPayload = validShifts.map(s => ({
            user_id: userId,
            employee_id: employeeIdMap.get(s.employeeId),
            date: s.date,
            start_time: s.startTime,
            end_time: s.endTime,
            type: s.type,
            description: s.description
        }));

        if (shiftsPayload.length > 0) {
            const chunkSize = 50;
            for (let i = 0; i < shiftsPayload.length; i += chunkSize) {
                const chunk = shiftsPayload.slice(i, i + chunkSize);
                const { error: shiftsError } = await supabase.from('shifts').insert(chunk);
                if (shiftsError) failures.push(`Shift Batch ${i}: ${shiftsError.message}`);
            }
        }

        // 5. MIGRATE EVENTS
        console.log('🎉 Migrating Events...');
        const customEvents = currentData.settings.events || [];
        const customHolidays = currentData.settings.holidays?.filter((h: any) => h.type === 'custom') || [];
        const eventsPayload = [
            ...customEvents.map((e: any) => ({
                user_id: userId,
                name: e.name,
                date: e.date,
                description: e.description,
                type: 'company_event'
            })),
            ...customHolidays.map((h: any) => ({
                user_id: userId,
                name: h.name,
                date: h.date,
                type: 'custom_holiday'
            }))
        ];

        if (eventsPayload.length > 0) {
            const { error: eventsError } = await supabase.from('events').insert(eventsPayload);
            if (eventsError) failures.push(`Events: ${eventsError.message}`);
        }

        console.log('✅ Migration Finished!');
        if (failures.length > 0) console.log('Failures:', failures);
        return { success: failures.length === 0, failures };
    } catch (e: any) {
        console.error('Critical Error:', e);
        return { success: false, failures: [e.message] };
    }
};

const main = async () => {
    console.log("Fetching schedule_data...");
    const { data: allData, error } = await supabase.from('schedule_data').select('*');

    if (error) {
        console.error("Error fetching schedule_data:", error);
        return;
    }

    if (!allData || allData.length === 0) {
        console.log("No data found in schedule_data.");
        return;
    }

    console.log(`Found ${allData.length} records to migrate.`);

    for (const record of allData) {
        // The record.id in schedule_data IS the user_id (it's a 1:1 mapping table usually)
        await executeMigration(record.data as ScheduleData, record.id);
    }

    // VERIFICATION
    console.log("\n--- VERIFICATION REPORT ---");
    const tables = ['employees', 'shifts', 'shift_templates', 'events'];
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        console.log(`Table '${table}': ${count} records.`);
    }
};

main();
