import { NextRequest, NextResponse } from 'next/server';
import { scrapeCharmDirectory } from '@/lib/charmScraper';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const baseUrl = searchParams.get('baseUrl');

  if (!baseUrl) {
    return NextResponse.json({ error: 'baseUrl is required' }, { status: 400 });
  }

  // Ensure baseUrl ends with /
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  // Construct repair URL
  // Note: The structure is usually "Repair and Diagnosis/" but might vary.
  // Charm links are usually case sensitive.
  const repairUrl = cleanBaseUrl + 'Repair and Diagnosis/';

  try {
    console.log(`Scraping repair directory: ${repairUrl}`);
    const links = await scrapeCharmDirectory(repairUrl);

    // Filter parent directory and map to desired format
    const categories = links
      .filter(link => !link.text.includes('Parent Directory') && !link.text.includes('Home'))
      .map(link => ({
        category: link.text,
        url: link.url
      }));

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error scraping repair directory:', error);
    return NextResponse.json({ error: 'Failed to scrape repair directory' }, { status: 500 });
  }
}
