
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase Admin (requires Service Role Key)
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
    : null;

export async function POST(req: Request) {
    try {
        const { to, userIds, subject, html, creatorId } = await req.json();

        if (!process.env.RESEND_API_KEY) {
            console.error("RESEND_API_KEY is missing.");
            return NextResponse.json({ error: "Server misconfiguration: No Email API Key" }, { status: 500 });
        }

        let targetEmails: string[] = [];

        // 1. Handle Multiple User IDs (Broadcast) - Using Supabase Admin
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            if (!supabaseAdmin) {
                console.warn("Cannot resolve userIds: SUPABASE_SERVICE_ROLE_KEY not set.");
            } else {
                // Fetch users in parallel
                const promises = userIds.map(uid => supabaseAdmin.auth.admin.getUserById(uid));
                const results = await Promise.all(promises);

                results.forEach(({ data, error }) => {
                    if (!error && data.user && data.user.email) {
                        targetEmails.push(data.user.email);
                    }
                });
            }
        }
        // 2. Handle Creator Lookup
        else if (to === 'creator_lookup' && creatorId) {
            if (!supabaseAdmin) {
                console.warn("Cannot resolve creatorId: SUPABASE_SERVICE_ROLE_KEY not set.");
            } else {
                const { data, error } = await supabaseAdmin.auth.admin.getUserById(creatorId);
                if (data?.user?.email) {
                    targetEmails.push(data.user.email);
                } else if (error) {
                    console.error("Error fetching creator:", error);
                }
            }
        }
        // 3. Direct Email
        else if (to && to !== 'creator_lookup') {
            targetEmails.push(to);
        }

        // Remove duplicates
        targetEmails = [...new Set(targetEmails)];

        if (targetEmails.length === 0) {
            console.warn("No valid recipients found.");
            // Return success to avoid frontend crash, but verify why.
            // If it was a broadcast with no valid emails found, valid case.
            return NextResponse.json({ message: "No recipients resolved", results: [] });
        }

        const results = [];

        // Send logic - Send regardless of NODE_ENV if Key exists
        for (const recipient of targetEmails) {
            const { data, error } = await resend.emails.send({
                from: 'Christianitatis <onboarding@resend.dev>', // Update this if you have a custom domain
                to: [recipient],
                subject: subject,
                html: html,
            });

            if (error) {
                console.error(`Failed to send to ${recipient}:`, error);
                results.push({ recipient, error });
            } else {
                results.push({ recipient, data });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error("Email API Error: ", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
