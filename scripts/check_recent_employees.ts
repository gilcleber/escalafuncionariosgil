
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRecent() {
    console.log("🕵️ CHECKING LAST 5 EMPLOYEES...");

    // Order by created_at desc if it exists, or just get all and slice
    const { data: rows, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    if (rows.length === 0) {
        console.log("❌ NO EMPLOYEE FOUND.");
    } else {
        console.log(`✅ FOUND ${rows.length} RECORD(S):`);
        rows.forEach(r => {
            console.log(`\n--- EMPLOYEE ---`);
            console.log(`Name: ${r.name}`);
            console.log(`Created At: ${r.created_at}`);
            console.log(`User_ID: ${r.user_id}`);
            console.log(`Active: ${r.active}`);
        });
    }
}

checkRecent();
