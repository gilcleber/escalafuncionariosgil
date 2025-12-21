
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const MY_ID = "f7418784-3317-48e5-8be2-c6945877e019";

async function checkDates() {
    console.log("📅 CHECKING SHIFT DATES...");

    const { data: shifts, error } = await supabase
        .from('shifts')
        .select('date')
        .eq('user_id', MY_ID)
        .order('date', { ascending: true }); // Get sorted

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    if (!shifts || shifts.length === 0) {
        console.log("❌ NO SHIFTS FOUND FOR THIS ID.");
    } else {
        const first = shifts[0].date;
        const last = shifts[shifts.length - 1].date;

        console.log(`✅ FOUND ${shifts.length} SHIFTS.`);
        console.log(`   First Shift: ${first}`);
        console.log(`   Last Shift:  ${last}`);

        // Show a few samples from Dec 2025 if any
        const dec25 = shifts.filter(s => s.date.includes('2025-12'));
        console.log(`   Shifts in Dec 2025: ${dec25.length}`);
    }
}

checkDates();
