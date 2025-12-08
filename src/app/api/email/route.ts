
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Valid key required for real sending
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Required to fetch user email by ID
);

export async function POST(req: Request) {
    try {
        const { to, userIds, subject, html, creatorId } = await req.json();

        let targetEmails: string[] = [];

        // 1. Handle Multiple User IDs (Broadcast)
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            const requests = userIds.map((id: string) => supabaseAdmin.auth.admin.getUserById(id));
            const responses = await Promise.all(requests);
            targetEmails = responses
                .map(r => r.data.user?.email)
                .filter((e): e is string => !!e);

            // Avoid spamming / huge lists in simulation, but for now it's fine.
        }
        // 2. Handle Creator Lookup
        else if (to === 'creator_lookup' && creatorId) {
            const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(creatorId);
            if (error || !user) {
                console.error('Creator lookup failed', error);
                return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
            }
            if (user.user.email) targetEmails.push(user.user.email);
        }
        // 3. Direct Email
        else if (to) {
            targetEmails.push(to);
        }

        if (targetEmails.length === 0) {
            return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
        }

        const results = [];

        // Send logic
        for (const recipient of targetEmails) {
            if (process.env.RESEND_API_KEY) {
                const { data, error } = await resend.emails.send({
                    from: 'Christianitatis <onboarding@resend.dev>',
                    to: [recipient],
                    subject: subject,
                    html: html,
                });
                results.push({ recipient, data, error });
            } else {
                console.log(`================================================`);
                console.log(`[EMAIL SIMULATION] Sending Email...`);
                console.log(`To: ${recipient}`);
                console.log(`Subject: ${subject}`);
                console.log(`Body (truncated): ${html.substring(0, 50)}...`);
                console.log(`================================================`);
                results.push({ recipient, status: 'simulated' });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
