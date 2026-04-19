/**
 * PATCH /api/seller/support/tickets/[id]
 * Seller can only re-open a closed/resolved ticket.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { computeSlaDeadline } from '@/lib/support/sla';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const ticketId = params.id;
    const body     = await request.json();
    const { userId, action } = body; // action: 'reopen'

    if (!userId || action !== 'reopen') {
      return NextResponse.json({ error: 'userId and action=reopen required' }, { status: 400 });
    }

    const seller = await resolveSellerInfo(userId);
    if (!seller) {
      return NextResponse.json({ error: 'Seller account not found' }, { status: 404 });
    }

    // Verify the ticket belongs to this seller
    const { data: ticket } = await supabaseAdmin
      .from('spf_support_tickets')
      .select('id, status, category, priority, raised_by_id')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    if (ticket.raised_by_id !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!['resolved', 'closed'].includes(ticket.status)) {
      return NextResponse.json({ error: 'Only resolved or closed tickets can be re-opened' }, { status: 400 });
    }

    // Re-open: reset status, clear resolved_at, extend SLA by same category/priority
    const newSla = computeSlaDeadline(ticket.category, ticket.priority);

    const { data: updated, error } = await supabaseAdmin
      .from('spf_support_tickets')
      .update({
        status:       'open',
        resolved_at:  null,
        sla_deadline: newSla.toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select('*')
      .single();

    if (error) throw error;

    // System comment
    await supabaseAdmin.from('spf_ticket_comments').insert({
      ticket_id:   ticketId,
      author_type: 'system',
      author_id:   null,
      author_name: 'System',
      message:     `Ticket re-opened by seller (${seller.business_name})`,
      is_internal: false,
    });

    return NextResponse.json({ ticket: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[seller/support/tickets PATCH]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
