/**
 * GET  /api/seller/support/tickets  — list this seller's tickets
 * POST /api/seller/support/tickets  — seller raises a new ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { computeSlaDeadline } from '@/lib/support/sla';

export const dynamic = 'force-dynamic';

async function resolveSellerInfo(userId: string) {
  // Look up the seller row linked to this user account
  const { data } = await supabaseAdmin
    .from('spf_sellers')
    .select('id, business_name, email')
    .eq('user_id', userId)
    .maybeSingle();
  return data as { id: string; business_name: string; email: string } | null;
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // optional filter

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const seller = await resolveSellerInfo(userId);
    if (!seller) {
      return NextResponse.json({ error: 'Seller account not found' }, { status: 404 });
    }

    const now       = new Date();
    let query = supabaseAdmin
      .from('spf_support_tickets')
      .select('*')
      .eq('raised_by_id', seller.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status && status !== 'all') query = query.eq('status', status);

    const { data: tickets, error } = await query;
    if (error) throw error;

    const rows = (tickets || []).map((t: any) => ({
      ...t,
      sla_breached: !['resolved', 'closed'].includes(t.status)
                    && new Date(t.sla_deadline) < now,
    }));

    // Simple stats for this seller
    const stats = {
      open:      rows.filter((t: any) => t.status === 'open').length,
      inProgress:rows.filter((t: any) => t.status === 'in_progress').length,
      resolved:  rows.filter((t: any) => t.status === 'resolved').length,
      total:     rows.length,
    };

    return NextResponse.json({ tickets: rows, stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[seller/support/tickets GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subject, message, category, priority, relatedOrderNumber } = body;

    if (!userId || !subject?.trim() || !message?.trim() || !category) {
      return NextResponse.json(
        { error: 'userId, subject, message, and category are required' },
        { status: 400 },
      );
    }

    const seller = await resolveSellerInfo(userId);
    if (!seller) {
      return NextResponse.json({ error: 'Seller account not found' }, { status: 404 });
    }

    // Generate ticket number: TKT-YYYYMMDD-NNNN
    const dateStr  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const dayStart = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}T00:00:00`;
    const { count } = await supabaseAdmin
      .from('spf_support_tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dayStart);
    const ticketNumber = `TKT-${dateStr}-${String((count || 0) + 1).padStart(4, '0')}`;

    const slaDeadline = computeSlaDeadline(category, priority || 'medium');

    const { data: ticket, error } = await supabaseAdmin
      .from('spf_support_tickets')
      .insert({
        ticket_number:        ticketNumber,
        subject:              subject.trim(),
        message:              message.trim(),
        category,
        priority:             priority || 'medium',
        status:               'open',
        raised_by_type:       'seller',
        raised_by_id:         seller.id,
        raised_by_name:       seller.business_name,
        related_order_number: relatedOrderNumber?.trim() || null,
        sla_deadline:         slaDeadline.toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;

    // Auto-add opening message as first comment
    await supabaseAdmin.from('spf_ticket_comments').insert({
      ticket_id:   ticket.id,
      author_type: 'seller',
      author_id:   seller.id,
      author_name: seller.business_name,
      message:     message.trim(),
      is_internal: false,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[seller/support/tickets POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
