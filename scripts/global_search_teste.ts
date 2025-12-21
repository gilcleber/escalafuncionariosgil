
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findAnyTeste() {
    console.log("🕵️ GLOBAL SEARCH FOR 'TESTE' (Any User ID)...");

    const { data: rows, error } = await supabase
        .from('employees')
        .select('*')
        .ilike('name', '%TESTE%');

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    if (rows.length === 0) {
        console.log("❌ ABSOLUTELY NO 'TESTE' FOUND IN THE ENTIRE TABLE.");
    } else {
        console.log(`✅ FOUND ${rows.length} MATCHES globally:`);
        rows.forEach(r => {
            console.log(`   - Name: ${r.name}`);
            console.log(`     User_ID: ${r.user_id}`);
            console.log(`     Active: ${r.active}`);
        });
    }
}

findAnyTeste();
