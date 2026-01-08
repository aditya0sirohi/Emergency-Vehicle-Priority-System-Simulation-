import { NextRequest, NextResponse } from 'next/server';

const OPENROUTE_API_KEY = '5b3ce3597851110001cf62484720627ea924407099674626b693b31c';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startLng = searchParams.get('startLng');
    const startLat = searchParams.get('startLat');
    const endLng = searchParams.get('endLng');
    const endLat = searchParams.get('endLat');

    if (!startLng || !startLat || !endLng || !endLat) {
      return NextResponse.json(
        { error: 'Missing coordinates' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${OPENROUTE_API_KEY}&start=${startLng},${startLat}&end=${endLng},${endLat}`,
      {
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        }
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in directions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch directions' },
      { status: 500 }
    );
  }
}
