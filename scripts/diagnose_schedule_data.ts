
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
    console.log("🕵️ DIAGNOSING SCHEDULE_DATA TABLE...");

    // Select all rows
    const { data: rows, error } = await supabase
        .from('schedule_data')
        .select('*');

    if (error) {
        console.error("❌ Error fetching rows:", error.message);
        return;
    }

    console.log(`🔎 Found ${rows.length} rows.`);

    for (const row of rows) {
        let preview = "???";
        let date = "???";
        try {
            const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            if (d.employees && Array.isArray(d.employees)) {
                preview = d.employees.map((e: any) => e.name).slice(0, 5).join(", ");
            }
            if (d.lastUpdated || d.updated_at) {
                date = new Date(d.lastUpdated || d.updated_at || row.updated_at).toLocaleString();
            }
        } catch (e) {
            preview = "Parse Error";
        }
        console.log(`📂 ID: ${row.id.padEnd(40)} | Updated: ${date} | Employees: ${preview}`);
    }
}

diagnose();
