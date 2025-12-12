
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from '@/firebase/admin';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Valid key required for real sending

// Ensure the admin app is initialized
initializeAdminApp();

export async function POST(req: Request) {
    try {
        const { to, userIds, subject, html, creatorId } = await req.json();

        let targetEmails: string[] = [];

        // 1. Handle Multiple User IDs (Broadcast)
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            const auth = getAuth();
            const userRecords = await auth.getUsers(userIds.map(uid => ({ uid })));
            targetEmails = userRecords.users
                .map(user => user.email)
                .filter((e): e is string => !!e);
        }
        // 2. Handle Creator Lookup
        else if (to === 'creator_lookup' && creatorId) {
            const auth = getAuth();
            try {
                const userRecord = await auth.getUser(creatorId);
                if (userRecord.email) {
                    targetEmails.push(userRecord.email);
                }
            } catch (error) {
                console.error('Creator lookup failed', error);
                return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
            }
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
            if (process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production') {
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
        console.error("Email API Error: ", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
