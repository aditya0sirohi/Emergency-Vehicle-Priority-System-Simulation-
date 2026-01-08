import { NextRequest, NextResponse } from 'next/server';

const OPENROUTE_API_KEY = '5b3ce3597851110001cf62484720627ea924407099674626b693b31c';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      'https://api.openrouteservice.org/v2/matrix/driving-car',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          'Content-Type': 'application/json',
          'Authorization': OPENROUTE_API_KEY,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in matrix-distances API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matrix distances' },
      { status: 500 }
    );
  }
}
