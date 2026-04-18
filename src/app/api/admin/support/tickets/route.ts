/**
 * GET  /api/admin/support/tickets  — list tickets with filters + stats
 * POST /api/admin/support/tickets  — create a new ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { computeSlaDeadline } from '@/lib/support/sla';

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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId   = searchParams.get('adminUserId');
    const status        = searchParams.get('status');        // all|open|in_progress|...
    const category      = searchParams.get('category');
    const raisedByType  = searchParams.get('raisedByType'); // all|admin|seller
    const priority      = searchParams.get('priority');

    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId required' }, { status: 400 });
    }
    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Fetch tickets ─────────────────────────────────────────────────────
    let query = supabaseAdmin
      .from('spf_support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (status && status !== 'all')          query = query.eq('status', status);
    if (category && category !== 'all')      query = query.eq('category', category);
    if (raisedByType && raisedByType !== 'all') query = query.eq('raised_by_type', raisedByType);
    if (priority && priority !== 'all')      query = query.eq('priority', priority);

    const { data: tickets, error } = await query;
    if (error) throw error;

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    // Annotate each ticket with computed sla_breached flag
    const rows = (tickets || []).map((t: any) => ({
      ...t,
      sla_breached: !['resolved', 'closed'].includes(t.status)
                    && new Date(t.sla_deadline) < now,
    }));

    // ── Stats (always over ALL tickets, ignoring current filters) ─────────
    const { data: allTickets } = await supabaseAdmin
      .from('spf_support_tickets')
      .select('status, sla_deadline, resolved_at');

    const statsRows = allTickets || [];
    const stats = {
      open:          statsRows.filter((t: any) => t.status === 'open').length,
      inProgress:    statsRows.filter((t: any) => t.status === 'in_progress').length,
      slaBreached:   statsRows.filter((t: any) =>
        !['resolved','closed'].includes(t.status) && new Date(t.sla_deadline) < now
      ).length,
      resolvedToday: statsRows.filter((t: any) =>
        t.status === 'resolved' && t.resolved_at && new Date(t.resolved_at) >= todayStart
      ).length,
      total:         statsRows.length,
    };

    return NextResponse.json({ tickets: rows, stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[admin/support/tickets GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      adminUserId,
      subject, message, category, priority,
      raisedByType,   // 'admin' | 'seller'
      raisedById,     // seller UUID (if raisedByType === 'seller')
      raisedByName,   // display name
      relatedOrderNumber,
    } = body;

    if (!adminUserId || !subject?.trim() || !message?.trim() || !category || !raisedByName) {
      return NextResponse.json(
        { error: 'adminUserId, subject, message, category, and raisedByName are required' },
        { status: 400 },
      );
    }
    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate ticket number: TKT-YYYYMMDD-NNNN
    const dateStr    = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const dayStart   = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}T00:00:00`;
    const { count }  = await supabaseAdmin
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
        raised_by_type:       raisedByType || 'admin',
        raised_by_id:         raisedById   || adminUserId,
        raised_by_name:       raisedByName,
        related_order_number: relatedOrderNumber?.trim() || null,
        sla_deadline:         slaDeadline.toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;

    // Auto-add opening message as first comment
    await supabaseAdmin.from('spf_ticket_comments').insert({
      ticket_id:   ticket.id,
      author_type: raisedByType || 'admin',
      author_id:   raisedById   || adminUserId,
      author_name: raisedByName,
      message:     message.trim(),
      is_internal: false,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[admin/support/tickets POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
