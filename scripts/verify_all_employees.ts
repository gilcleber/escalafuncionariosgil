
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const MY_ID = "f7418784-3317-48e5-8be2-c6945877e019";

async function listAll() {
    console.log(`📋 LISTING ALL EMPLOYEES FOR ID: ${MY_ID}...\n`);

    const { data: rows, error } = await supabase
        .from('employees')
        .select('name, id, created_at')
        .eq('user_id', MY_ID)
        .order('name'); // Alphabetical to make it easy to read

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    if (!rows || rows.length === 0) {
        console.log("❌ NO EMPLOYEES FOUND.");
    } else {
        console.log(`✅ FOUND ${rows.length} EMPLOYEES:`);
        console.table(rows);

        // Specific check for TESTE
        const teste = rows.find(r => r.name.toUpperCase().includes('TESTE'));
        if (teste) {
            console.log("\n🎯 ACHOU! O 'TESTE' ESTÁ AQUI:");
            console.log(teste);
        } else {
            console.log("\n⚠️ NÃO ACHEI NINGUÉM COM 'TESTE' NO NOME.");
        }
    }
}

listAll();
