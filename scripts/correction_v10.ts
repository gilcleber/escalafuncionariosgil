
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WRONG_ID = "c313bb70-1946-40de-9b31-81029cf13338";
const RIGHT_ID = "f7418784-3317-48e5-8be2-c6945877e019";

async function correctData() {
    console.log("🛠️ STARTING ID CORRECTION...");
    console.log(`FROM: ${WRONG_ID}`);
    console.log(`TO:   ${RIGHT_ID}`);

    // 1. Check Profiles
    console.log("\nChecking Profiles...");
    const { data: wrongProfile } = await supabase.from('profiles').select('*').eq('id', WRONG_ID).single();
    if (wrongProfile) {
        console.log("  - Found profile at Wrong ID. Moving settings to Right ID...");
        // Upsert right profile
        const { error } = await supabase.from('profiles').upsert({
            id: RIGHT_ID,
            name: wrongProfile.name || 'Minha Empresa',
            settings: wrongProfile.settings
        });
        if (error) console.error("    Error upserting profile:", error.message);
        else console.log("    ✅ Profile moved.");
    } else {
        console.log("  - No wrong profile found (or already moved).");
    }

    // 2. Employees
    console.log("\nChecking Employees...");
    const { count: empCount } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('user_id', WRONG_ID);
    console.log(`  - Found ${empCount} employees with Wrong ID.`);
    if (empCount && empCount > 0) {
        const { error } = await supabase.from('employees').update({ user_id: RIGHT_ID }).eq('user_id', WRONG_ID);
        if (error) console.error("    Error updating employees:", error.message);
        else console.log("    ✅ Employees updated.");
    }

    // 3. Shift Templates
    console.log("\nChecking Shift Templates...");
    // Templates might conflict? Assuming simple update.
    const { count: tmplCount } = await supabase.from('shift_templates').select('*', { count: 'exact', head: true }).eq('user_id', WRONG_ID);
    console.log(`  - Found ${tmplCount} templates with Wrong ID.`);
    if (tmplCount && tmplCount > 0) {
        const { error } = await supabase.from('shift_templates').update({ user_id: RIGHT_ID }).eq('user_id', WRONG_ID);
        if (error) console.error("    Error updating shift_templates:", error.message);
        else console.log("    ✅ Templates updated.");
    }

    // 4. Events
    console.log("\nChecking Events...");
    const { count: evtCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('user_id', WRONG_ID);
    console.log(`  - Found ${evtCount} events with Wrong ID.`);
    if (evtCount && evtCount > 0) {
        const { error } = await supabase.from('events').update({ user_id: RIGHT_ID }).eq('user_id', WRONG_ID);
        if (error) console.error("    Error updating events:", error.message);
        else console.log("    ✅ Events updated.");
    }

    // 5. Shifts (The big one)
    console.log("\nChecking Shifts...");
    const { count: shiftCount } = await supabase.from('shifts').select('*', { count: 'exact', head: true }).eq('user_id', WRONG_ID);
    console.log(`  - Found ${shiftCount} shifts with Wrong ID.`);
    if (shiftCount && shiftCount > 0) {
        const { error } = await supabase.from('shifts').update({ user_id: RIGHT_ID }).eq('user_id', WRONG_ID);
        if (error) console.error("    Error updating shifts:", error.message);
        else console.log("    ✅ Shifts updated.");
    }

    console.log("\n✨ CORRECTION COMPLETE.");
}

correctData();
