
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_ID = "f7418784-3317-48e5-8be2-c6945877e019";

async function freshMigration() {
    console.log(`🚀 STARTING FRESH MIGRATION V11`);
    console.log(`🎯 TARGET ID: ${TARGET_ID}`);

    // 1. FETCH SOURCE DATA (JSON)
    console.log(`\n📥 FETCHING SOURCE JSON...`);
    const { data: sourceRow, error: sourceError } = await supabase
        .from('schedule_data')
        .select('*')
        .eq('id', TARGET_ID)
        .single();

    if (sourceError || !sourceRow) {
        console.error("❌ FAILED TO READ SOURCE JSON:", sourceError?.message);
        return;
    }

    const jsonData = sourceRow.data;
    console.log(`✅ JSON LOADED. Processing...`);

    // 2. CLEANUP EXISTING RELATIONAL DATA
    console.log(`\n🧹 CLEANING UP OLD RELATIONAL DATA...`);

    // Order matters for Foreign Keys
    const tablesToDelete = ['shifts', 'employees', 'events', 'shift_templates'];

    for (const table of tablesToDelete) {
        const { error: delError } = await supabase
            .from(table)
            .delete()
            .eq('user_id', TARGET_ID);

        if (delError) {
            console.error(`   ❌ Error deleting from ${table}:`, delError.message);
        } else {
            console.log(`   ✅ Deleted rows from ${table}`);
        }
    }
    // Delete profile separately by ID
    const { error: profDelError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', TARGET_ID);
    if (!profDelError) console.log(`   ✅ Deleted rows from profiles`);


    // 3. MIGRATE PROFILES / SETTINGS
    console.log(`\n👤 MIGRATING PROFILE & SETTINGS...`);
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: TARGET_ID,
            // user_id: TARGET_ID, // Column does not exist in profiles table
            email: 'gilcleber@example.com',
            settings: jsonData.settings || {}
        });

    if (profileError) console.error("   ❌ Profile Error:", profileError.message);
    else console.log("   ✅ Profile Created/Updated.");


    // 4. MIGRATE SHIFT TEMPLATES (Departments?)
    // JSON usually stores department templates in settings.departmentTemplates
    // We will put them into 'shift_templates' table if that's the design, OR just keep in profile settings.
    // The previous design seemed to be: 'shift_templates' table specific logic?
    // Let's check jsonData.
    // Assuming jsonData.settings.departmentTemplates exists.
    // But 'shift_templates' table might be for reusable shift types?
    // For now, let's Stick to keeping settings in Profile JSONB as implemented in Phase 4.
    // Wait, Phase 4 `useSettings.ts` fetches `shift_templates`.
    // If the User added templates manually, they might be there.
    // But `schedule_data` usually keeps them in `settings`. so we already migrated them via `profiles.settings`.
    // We will skip `shift_templates` table population UNLESS data suggests otherwise.


    // 5. MIGRATE EMPLOYEES
    console.log(`\n👥 MIGRATING EMPLOYEES...`);
    const employees = jsonData.employees || [];
    const idMap = new Map(); // OldID -> NewUUID

    for (const emp of employees) {
        const { data: newEmp, error: empError } = await supabase
            .from('employees')
            .insert({
                user_id: TARGET_ID,
                name: emp.name,
                active: emp.active !== false,
                position: emp.position || 'Operador',
                // We let Supabase generate the UUID 'id'
            })
            .select()
            .single();

        if (empError) {
            console.error(`   ❌ Failed to insert ${emp.name}:`, empError.message);
        } else {
            console.log(`   ✅ Migrated: ${emp.name}`);
            idMap.set(emp.id, newEmp.id);
        }
    }

    // 6. MIGRATE EVENTS
    console.log(`\n📅 MIGRATING EVENTS...`);
    // Events in JSON usually in `shifts` with type='event' OR `settings.events`?
    // Phase 4 `useSettings` implies `events` table describes holidays/custom events.
    // Check jsonData structure... usually `settings.customHolidays`?
    // Let's migrate `jsonData.settings.customHolidays` to `events` table.
    const customHolidays = jsonData.settings?.customHolidays || [];

    for (const holiday of customHolidays) {
        await supabase.from('events').insert({
            user_id: TARGET_ID,
            title: holiday.name,
            start_date: holiday.date,
            end_date: holiday.date,
            type: 'holiday',
            description: 'Imported from settings'
        });
    }
    console.log(`   ✅ Migrated ${customHolidays.length} custom holidays.`);


    // 7. MIGRATE SHIFTS (The Big One)
    console.log(`\n⏰ MIGRATING SHIFTS...`);
    const shifts = jsonData.shifts || [];
    let shiftCount = 0;

    // Batch insert for performance? Or one by one for safety mapping?
    // One by one loop is safer for mapping checks.

    const shiftPayloads = [];

    for (const shift of shifts) {
        const newEmpId = idMap.get(shift.employeeId);
        if (!newEmpId) {
            // console.warn(`   ⚠️ Skipping shift for unknown employee ID: ${shift.employeeId}`);
            continue;
        }

        // Fix Empty Time Strings and satisfy NOT NULL constraint
        let start = shift.startTime;
        let end = shift.endTime;

        // Default to 00:00:00 for non-work shifts or missing times
        if (!start || start === "") start = "00:00:00";
        else if (start.length === 5) start += ":00";

        if (!end || end === "") end = "00:00:00";
        else if (end.length === 5) end += ":00";

        shiftPayloads.push({
            user_id: TARGET_ID,
            employee_id: newEmpId,
            date: shift.date,
            type: shift.type,
            start_time: start,
            end_time: end,
            description: shift.description
        });
    }

    // Insert in chunks of 100
    const CHUNK_SIZE = 100;
    for (let i = 0; i < shiftPayloads.length; i += CHUNK_SIZE) {
        const chunk = shiftPayloads.slice(i, i + CHUNK_SIZE);
        const { error: shiftBatchError } = await supabase
            .from('shifts')
            .insert(chunk);

        if (shiftBatchError) {
            console.error(`   ❌ Batch Insert Error at index ${i}:`, shiftBatchError.message);
        } else {
            shiftCount += chunk.length;
            process.stdout.write(`.`); // Progress dot
        }
    }

    console.log(`\n   ✅ Migrated ${shiftCount} SHIFTS.`);

    console.log(`\n✨ MIGRATION V11 COMPLETE.`);
}

freshMigration();
