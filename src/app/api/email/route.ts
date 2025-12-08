
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
        const { to, subject, html, creatorId } = await req.json();

        let recipient = to;

        // Handle creator lookup if needed
        if (to === 'creator_lookup' && creatorId) {
            const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(creatorId);
            if (error || !user) {
                console.error('Creator lookup failed', error);
                return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
            }
            recipient = user.user.email;
        }

        if (!recipient) {
            return NextResponse.json({ error: 'No recipient' }, { status: 400 });
        }

        // Attempt to send via Resend if key exists
        if (process.env.RESEND_API_KEY) {
            const { data, error } = await resend.emails.send({
                from: 'Christianitatis <onboarding@resend.dev>', // Update with verify domain
                to: [recipient],
                subject: subject,
                html: html,
            });

            if (error) {
                console.error('Resend Error:', error);
                // Fallback to log for development
                console.log(`[MOCK EMAIL] To: ${recipient}, Subject: ${subject}`);
                return NextResponse.json({ error });
            }
            return NextResponse.json(data);
        }

        // Default Mock fallback
        console.log(`================================================`);
        console.log(`[EMAIL SIMULATION] Sending Email...`);
        console.log(`To: ${recipient}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${html}`);
        console.log(`================================================`);

        return NextResponse.json({ success: true, message: 'Email logged to console' });

    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
