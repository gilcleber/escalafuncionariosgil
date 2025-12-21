
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const MY_ID = "f7418784-3317-48e5-8be2-c6945877e019";

async function testInsert() {
    console.log("🤖 ATTEMPTING INSERT VIA SCRIPT...");

    const { data, error } = await supabase
        .from('employees')
        .insert([{
            user_id: MY_ID,
            name: 'TESTE ROBOT 3000',
            position: 'Bot',
            active: true
        }])
        .select()
        .single();

    if (error) {
        console.error("❌ INSERT FAILED:", error.message);
        console.error("   Details:", error.details);
        console.error("   Hint:", error.hint);
    } else {
        console.log("✅ INSERT SUCCESS!");
        console.log("   ID:", data.id);
        console.log("   Name:", data.name);
    }
}

testInsert();
