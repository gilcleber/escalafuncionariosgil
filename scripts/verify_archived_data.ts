
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Hardcoded keys for script execution
const supabaseUrl = "https://vbqwqhydlrkgkoiypihi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXdxaHlkbHJrZ2tvaXlwaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDkzODAsImV4cCI6MjA2NDMyNTM4MH0.ihk8s2Tkwbb8UGv0ouCjTkxAAYB7iWuF6vZ3fMKuWLY";

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_USER_ID = 'f7418784-3317-48e5-8be2-c6945877e019';
const ARCHIVED_NAMES = ['DANILO', 'PEDRO'];

async function verifyArchivedData() {
    console.log(`Checking archived data for User ID: ${TARGET_USER_ID}`);
    console.log(`Looking for employees: ${ARCHIVED_NAMES.join(', ')}`);

    // 1. Check Employees Table
    const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', TARGET_USER_ID)
        .in('name', ARCHIVED_NAMES);

    if (empError) {
        console.error('Error fetching employees:', empError);
        return;
    }

    console.log('\n--- Employees Found ---');
    if (employees.length === 0) {
        console.log('WARNING: No employees found with these names!');
    } else {
        employees.forEach(emp => {
            console.log(`- ${emp.name} (ID: ${emp.id}) | Active: ${emp.active}`);
        });
    }

    // 2. Check Shifts Table for these Employees
    if (employees.length > 0) {
        const employeeIds = employees.map(e => e.id);
        const { data: shifts, error: shiftError } = await supabase
            .from('shifts')
            .select('*')
            .eq('user_id', TARGET_USER_ID)
            .in('employee_id', employeeIds);

        if (shiftError) {
            console.error('Error fetching shifts:', shiftError);
            return;
        }

        console.log('\n--- Shifts Found ---');
        console.log(`Total Shifts for ${ARCHIVED_NAMES.join(' & ')}: ${shifts.length}`);

        // Group by month to see if July/August exist
        const shiftsByMonth: Record<string, number> = {};
        shifts.forEach((s: any) => {
            const month = s.date.substring(0, 7); // YYYY-MM
            shiftsByMonth[month] = (shiftsByMonth[month] || 0) + 1;
        });

        console.table(shiftsByMonth);

        employees.forEach(emp => {
            const count = shifts.filter((s: any) => s.employee_id === emp.id).length;
            console.log(`- ${emp.name}: ${count} shifts`);
        });
    }
}

verifyArchivedData();
