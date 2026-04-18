/**
 * GET  /api/admin/support/tickets/[id]/comments  — fetch comment thread
 * POST /api/admin/support/tickets/[id]/comments  — add reply or internal note
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

async function verifyAdmin(id: string) {
  const { data } = await supabaseAdmin
    .from('spf_users')
    .select('is_admin')
    .eq('id', id)
    .single();
  return !!data?.is_admin;
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get('adminUserId');
    const ticketId   = params.id;

    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId required' }, { status: 400 });
    }
    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: comments, error } = await supabaseAdmin
      .from('spf_ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: comments || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[support/comments GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const ticketId = params.id;
    const body = await request.json();
    const { adminUserId, authorName, message, isInternal } = body;

    if (!adminUserId || !message?.trim() || !authorName?.trim()) {
      return NextResponse.json(
        { error: 'adminUserId, authorName, and message are required' },
        { status: 400 },
      );
    }
    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('spf_support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const { data: comment, error } = await supabaseAdmin
      .from('spf_ticket_comments')
      .insert({
        ticket_id:   ticketId,
        author_type: 'admin',
        author_id:   adminUserId,
        author_name: authorName.trim(),
        message:     message.trim(),
        is_internal: !!isInternal,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Bump ticket updated_at
    await supabaseAdmin
      .from('spf_support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[support/comments POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
