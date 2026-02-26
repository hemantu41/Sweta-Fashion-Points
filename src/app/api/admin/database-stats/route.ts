import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Get database statistics
 * Shows database size, table sizes, and usage metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Query to get database size and table sizes
    const { data: tableSizes, error: tableSizesError } = await supabaseAdmin.rpc(
      'get_table_sizes'
    );

    if (tableSizesError) {
      // If RPC doesn't exist, create it first
      console.error('RPC function not found. Need to create get_table_sizes function.');
    }

    // Get row counts for major tables
    const tables = [
      'spf_productdetails',
      'spf_users',
      'spf_payment_orders',
      'spf_sellers',
      'spf_delivery_partners',
      'spf_order_deliveries',
    ];

    const rowCounts = await Promise.all(
      tables.map(async (table) => {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });

        return {
          table,
          count: count || 0,
          error: error?.message,
        };
      })
    );

    // Estimate database size based on row counts
    // Rough estimates per row:
    // - products: 5KB
    // - users: 2KB
    // - orders: 3KB
    // - sellers: 2KB
    // - delivery_partners: 2KB
    // - deliveries: 1KB

    const sizeEstimates: Record<string, number> = {
      spf_productdetails: 5,
      spf_users: 2,
      spf_payment_orders: 3,
      spf_sellers: 2,
      spf_delivery_partners: 2,
      spf_order_deliveries: 1,
    };

    let totalEstimatedSizeKB = 0;
    const tableStats = rowCounts.map((item) => {
      const sizeKB = (item.count || 0) * (sizeEstimates[item.table] || 1);
      totalEstimatedSizeKB += sizeKB;

      return {
        table: item.table,
        rows: item.count,
        estimatedSizeKB: sizeKB,
        estimatedSizeMB: (sizeKB / 1024).toFixed(2),
      };
    });

    const totalEstimatedSizeMB = totalEstimatedSizeKB / 1024;

    // Supabase free tier limit: 500MB
    const freeTierLimitMB = 500;
    const usagePercentage = (totalEstimatedSizeMB / freeTierLimitMB) * 100;

    return NextResponse.json({
      success: true,
      stats: {
        totalEstimatedSizeMB: totalEstimatedSizeMB.toFixed(2),
        freeTierLimitMB,
        usagePercentage: usagePercentage.toFixed(2),
        remainingMB: (freeTierLimitMB - totalEstimatedSizeMB).toFixed(2),
        withinFreeLimit: totalEstimatedSizeMB < freeTierLimitMB,
      },
      tables: tableStats,
      note: 'Size estimates are approximate. Actual database size may vary.',
    });
  } catch (error: any) {
    console.error('[Database Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics', details: error.message },
      { status: 500 }
    );
  }
}
