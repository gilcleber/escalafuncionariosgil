
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const MY_ID = "f7418784-3317-48e5-8be2-c6945877e019";

async function checkIds() {
    console.log("🔗 CHECKING RELATIONS...");

    // 1. Get Employees
    const { data: employees } = await supabase.from('employees').select('id, name').eq('user_id', MY_ID);
    console.log(`Employees: ${employees?.length}`);
    employees?.forEach(e => console.log(`   [${e.name}] ID: ${e.id}`));

    // 2. Get Shifts
    const { data: shifts } = await supabase.from('shifts').select('employee_id, date').eq('user_id', MY_ID).limit(5);
    console.log(`\nShifts Sample (first 5):`);
    shifts?.forEach(s => console.log(`   Shift date: ${s.date} | Linked to Emp ID: ${s.employee_id}`));

    // 3. Verify Match
    if (employees && shifts && shifts.length > 0) {
        const sampleShift = shifts[0];
        const match = employees.find(e => e.id === sampleShift.employee_id);
        if (match) {
            console.log(`\n✅ MATCH FOUND! Shift points to ${match.name}`);
        } else {
            console.log(`\n❌ MISMATCH! Shift points to ${sampleShift.employee_id}, but that ID is NOT in the employee list.`);
        }
    }
}

checkIds();
