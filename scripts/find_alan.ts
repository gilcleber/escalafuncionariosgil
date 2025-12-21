
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findAlan() {
    console.log("🕵️ SEARCHING FOR 'ALAN'...");

    // Select all rows
    const { data: rows, error } = await supabase
        .from('schedule_data')
        .select('*');

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    let found = false;
    for (const row of rows) {
        let raw = typeof row.data === 'string' ? row.data : JSON.stringify(row.data);
        if (raw.toUpperCase().includes("ALAN")) {
            console.log(`✅ FOUND ALAN!`);
            console.log(`📂 ID: ${row.id}`);
            console.log(`📅 Updated: ${row.updated_at}`);
            found = true;
        }
    }

    if (!found) {
        console.log("❌ 'ALAN' NOT FOUND in any row.");
    }
}

findAlan();
