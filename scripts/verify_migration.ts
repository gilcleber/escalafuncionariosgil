
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TARGET_ID = "c313bb70-1946-40de-9b31-81029cf13338";

async function verify() {
    console.log(`🔍 Verifying data for Installation ID: ${TARGET_ID}`);

    const tables = ['profiles', 'employees', 'shifts', 'shift_templates', 'events'];
    const results: Record<string, number> = {};

    for (const table of tables) {
        // We filter by ID for profiles, user_id for others
        const column = table === 'profiles' ? 'id' : 'user_id';
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq(column, TARGET_ID);

        if (error) {
            console.error(`Error checking ${table}:`, error.message);
        } else {
            console.log(`✅ ${table}: ${count} records`);
            results[table] = count || 0;
        }
    }
}

verify();
