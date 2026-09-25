import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'DZ';
  const trend = searchParams.get('trend');
  const limit = parseInt(searchParams.get('limit') || '30');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: `Missing env vars: url=${!!supabaseUrl} key=${!!serviceKey}` },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let query = supabase
    .from('products')
    .select('*')
    .eq('country', country)
    .eq('is_active', true)
    .order('seller_count', { ascending: false })
    .order('avg_score', { ascending: false })
    .limit(limit);

  if (trend) {
    query = query.eq('trend', trend);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rising = (data || []).filter((p) => p.trend === 'rising').length;
  const stable = (data || []).filter((p) => p.trend === 'stable').length;
  const declining = (data || []).filter((p) => p.trend === 'declining').length;

  return NextResponse.json({
    products: data || [],
    total: (data || []).length,
    stats: { rising, stable, declining },
  });
}
