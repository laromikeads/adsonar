import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { ad_id, page_name, body: adBody, snapshot_url, country, sourcing_score, label, notes, tags } = body;

  if (!ad_id) {
    return NextResponse.json({ error: 'ad_id is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('saved_ads')
      .upsert(
        {
          ad_id,
          page_name,
          body: adBody,
          snapshot_url,
          country,
          sourcing_score,
          label,
          notes,
          tags,
        },
        { onConflict: 'ad_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  try {
    let query = supabase
      .from('saved_ads')
      .select('*')
      .order('saved_at', { ascending: false });

    if (country) {
      query = query.eq('country', country);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase.from('saved_ads').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
