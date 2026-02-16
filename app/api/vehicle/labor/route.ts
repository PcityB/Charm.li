import { NextRequest, NextResponse } from 'next/server';
import { scrapeCharmDirectory } from '@/lib/charmScraper';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const baseUrl = searchParams.get('baseUrl');

  if (!baseUrl) {
    return NextResponse.json({ error: 'baseUrl is required' }, { status: 400 });
  }

  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  // Construct Labor URL
  const laborPath = 'Parts and Labor/';
  const segments = laborPath.split('/').filter(s => s.length > 0);
  const encodedPath = segments.map(s => encodeURIComponent(s)).join('/') + '/';

  const laborUrl = cleanBaseUrl + encodedPath;

  try {
    console.log(`Scraping labor directory: ${laborUrl}`);
    const links = await scrapeCharmDirectory(laborUrl);

    // Scrape Labor categories
    const categories = links
      .filter(link => !link.text.includes('Parent Directory') && !link.text.includes('Home'))
      .map(link => ({
        category: link.text,
        url: link.url
      }));

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error scraping labor directory:', error);
    return NextResponse.json({ error: 'Failed to scrape labor directory' }, { status: 500 });
  }
}
