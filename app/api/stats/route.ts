import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://test.cors.workers.dev/?https://bsky-search.jazco.io/stats'
    );
    const data = await response.json();

    return NextResponse.json({
      total_users: data.total_users,
      // TODO: update this dynamically
      growth_rate_per_second: 4.5,
      last_update_time: new Date(data.updated_at),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
