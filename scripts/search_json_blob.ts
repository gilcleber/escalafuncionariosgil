
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchBlob() {
    console.log("🕵️ SEARCHING JSON BLOB FOR 'OPERADOR FAKE'...");

    // We can't easily query inside the JSON blob via API filter like 'ilike' on a field inside,
    // but we can fetch the row and check.
    // We suspect it's in the row with the user's ID (or maybe the old ID if App failed to switch).
    // Let's check BOTH IDs in schedule_data.

    const IDS = [
        "f7418784-3317-48e5-8be2-c6945877e019", // Real
        "c313bb70-1946-40de-9b31-81029cf13338"  // Wrong
    ];

    const { data: rows } = await supabase
        .from('schedule_data')
        .select('*')
        .in('id', IDS);

    if (!rows) return;

    rows.forEach(row => {
        const jsonString = JSON.stringify(row.data);
        if (jsonString.includes("OPERADOR FAKE") || jsonString.includes("TESTE")) {
            console.log(`✅ FOUND IT! The data is hidden inside the OLD JSON BLOB.`);
            console.log(`   Row ID: ${row.id}`);
            console.log(`   This proves the frontend is still using the Legacy Mode.`);
        } else {
            console.log(`❌ Not found in row ${row.id}`);
        }
    });
}

searchBlob();
