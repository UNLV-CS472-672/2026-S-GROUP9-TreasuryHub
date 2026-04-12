import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function globalSetup() {
    console.log('Running global setup...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Checking for registration w/ browser, since 3 different users are registered in global.setup.ts
    const testEmails = [
        'test.chromium@register.playwright',
        'test.firefox@register.playwright',
        'test.webkit@register.playwright',
    ];

    const { data: users } = await supabase.auth.admin.listUsers();
    for (const email of testEmails) {
        const testUser = users?.users.find(u => u.email === email);
        if (testUser) {
            console.log(`Deleting existing test user: ${email}`);
            await supabase.auth.admin.deleteUser(testUser.id);
        } else {
            console.log('No existing test user found, clean to register.');
        }
    }
}

export default globalSetup;