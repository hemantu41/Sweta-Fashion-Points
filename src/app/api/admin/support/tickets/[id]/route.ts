/**
 * PATCH /api/admin/support/tickets/[id]
 * Update ticket status, priority, or assignment.
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const ticketId = params.id;
    const body = await request.json();
    const { adminUserId, status, priority } = body;

    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId required' }, { status: 400 });
    }
    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const VALID_STATUSES = ['open', 'in_progress', 'waiting_on_seller', 'resolved', 'closed'];
    const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: `Invalid priority: ${priority}` }, { status: 400 });
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status)   updateData.status   = status;
    if (priority) updateData.priority = priority;

    // Set resolved_at when moving to resolved
    if (status === 'resolved') updateData.resolved_at = new Date().toISOString();
    if (status === 'open' || status === 'in_progress') updateData.resolved_at = null;

    const { data: ticket, error } = await supabaseAdmin
      .from('spf_support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select('*')
      .single();

    if (error) throw error;

    // Auto-add system comment on status change
    if (status) {
      const statusLabels: Record<string, string> = {
        open:                'Status changed to Open',
        in_progress:         'Status changed to In Progress',
        waiting_on_seller:   'Waiting on seller response',
        resolved:            'Ticket marked as Resolved',
        closed:              'Ticket closed',
      };
      await supabaseAdmin.from('spf_ticket_comments').insert({
        ticket_id:   ticketId,
        author_type: 'system',
        author_id:   null,
        author_name: 'System',
        message:     statusLabels[status] ?? `Status changed to ${status}`,
        is_internal: true,
      });
    }

    return NextResponse.json({ ticket });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[admin/support/tickets PATCH]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
