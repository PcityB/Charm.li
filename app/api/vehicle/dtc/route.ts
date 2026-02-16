import { NextRequest, NextResponse } from 'next/server';
import { scrapeCharmDirectory } from '@/lib/charmScraper';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const baseUrl = searchParams.get('baseUrl');

  if (!baseUrl) {
    return NextResponse.json({ error: 'baseUrl is required' }, { status: 400 });
  }

  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  // Construct DTC URL path segments
  const segments = [
    'Repair and Diagnosis',
    'A L L  Diagnostic Trouble Codes ( DTC )'
  ];

  const encodedPath = segments.map(s => encodeURIComponent(s)).join('/') + '/';
  const dtcUrl = cleanBaseUrl + encodedPath;

  try {
    console.log(`Scraping DTC directory: ${dtcUrl}`);
    const links = await scrapeCharmDirectory(dtcUrl);

    // Scrape DTC categories
    const categories = links
      .filter(link => !link.text.includes('Parent Directory') && !link.text.includes('Home'))
      .map(link => ({
        category: link.text,
        url: link.url
      }));

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error scraping DTC directory:', error);
    return NextResponse.json({ error: 'Failed to scrape DTC directory' }, { status: 500 });
  }
}
