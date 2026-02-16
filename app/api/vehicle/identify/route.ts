import { NextRequest, NextResponse } from 'next/server';
import { resolveCharmVehicle } from '@/lib/charmScraper';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const vin = searchParams.get('vin');

  if (!vin) {
    return NextResponse.json({ error: 'VIN is required' }, { status: 400 });
  }

  try {
    console.log(`Identifying vehicle for VIN: ${vin}`);
    const result = await resolveCharmVehicle(vin);

    return NextResponse.json({
      status: 'found',
      nhtsa_data: result.nhtsa_data,
      charm_base_url: result.charm_base_url
    });
  } catch (error: any) {
    console.error('Error identifying vehicle:', error);

    // Determine if it was a specific scraping error or general error
    let status = 500;
    let message = 'Internal Server Error';

    if (error.message.includes('Could not find')) {
      status = 404;
      message = error.message;
    } else if (error.message.includes('Failed to decode VIN')) {
      status = 400;
      message = error.message;
    }

    return NextResponse.json({
      status: 'not_found',
      error: message
    }, { status });
  }
}
