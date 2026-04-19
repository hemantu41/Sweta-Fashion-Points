/**
 * GET  /api/seller/support/tickets/[id]/comments  — fetch thread (seller view)
 * POST /api/seller/support/tickets/[id]/comments  — seller adds a reply
 *
 * Sellers cannot see is_internal = true comments (admin-only notes).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

async function resolveSellerInfo(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('spf_sellers')
    .select('id, business_name')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) console.error('[resolveSellerInfo]', error.message);
  return data as { id: string; business_name: string } | null;
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId   = searchParams.get('userId');
    const ticketId = params.id;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const seller = await resolveSellerInfo(userId);
    if (!seller) {
      return NextResponse.json({ error: 'Seller account not found' }, { status: 404 });
    }

    // Verify ticket belongs to this seller
    const { data: ticket } = await supabaseAdmin
      .from('spf_support_tickets')
      .select('raised_by_id')
      .eq('id', ticketId)
      .single();

    if (!ticket || ticket.raised_by_id !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Filter out internal (admin-only) notes
    const { data: comments, error } = await supabaseAdmin
      .from('spf_ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: comments || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[seller/support/comments GET]', message);
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
    const body     = await request.json();
    const { userId, message } = body;

    if (!userId || !message?.trim()) {
      return NextResponse.json({ error: 'userId and message are required' }, { status: 400 });
    }

    const seller = await resolveSellerInfo(userId);
    if (!seller) {
      return NextResponse.json({ error: 'Seller account not found' }, { status: 404 });
    }

    // Verify ticket belongs to this seller and is not closed
    const { data: ticket } = await supabaseAdmin
      .from('spf_support_tickets')
      .select('id, status, raised_by_id')
      .eq('id', ticketId)
      .single();

    if (!ticket || ticket.raised_by_id !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'Ticket is closed — re-open it before replying' }, { status: 400 });
    }

    const { data: comment, error } = await supabaseAdmin
      .from('spf_ticket_comments')
      .insert({
        ticket_id:   ticketId,
        author_type: 'seller',
        author_id:   seller.id,
        author_name: seller.business_name,
        message:     message.trim(),
        is_internal: false,
      })
      .select('*')
      .single();

    if (error) throw error;

    // If status was waiting_on_seller, bump back to in_progress automatically
    if (ticket.status === 'waiting_on_seller') {
      await supabaseAdmin
        .from('spf_support_tickets')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      await supabaseAdmin.from('spf_ticket_comments').insert({
        ticket_id:   ticketId,
        author_type: 'system',
        author_id:   null,
        author_name: 'System',
        message:     'Seller replied — status changed to In Progress',
        is_internal: true,
      });
    } else {
      // Just bump updated_at
      await supabaseAdmin
        .from('spf_support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[seller/support/comments POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
