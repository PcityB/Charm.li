import axios from 'axios';
import * as cheerio from 'cheerio';
import stringSimilarity from 'string-similarity';

interface VehicleInfo {
  year: string;
  make: string;
  model: string;
}

interface ScrapedLink {
  text: string;
  url: string;
  name: string; // Derived from URL for better matching
}

const CHARM_BASE_URL = 'https://charm.li';
const NHTSA_API_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin';

// Simple in-memory cache
const vinCache = new Map<string, { info: VehicleInfo; url: string }>();

async function getNHTSAData(vin: string): Promise<VehicleInfo> {
  try {
    const response = await axios.get(`${NHTSA_API_URL}/${vin}?format=json`);
    const results = response.data.Results;

    const year = results.find((r: any) => r.Variable === 'Model Year')?.Value;
    const make = results.find((r: any) => r.Variable === 'Make')?.Value;
    const model = results.find((r: any) => r.Variable === 'Model')?.Value;

    if (!year || !make || !model) {
      throw new Error('Incomplete vehicle data from NHTSA');
    }

    return { year, make, model };
  } catch (error) {
    console.error('Error fetching NHTSA data:', error);
    throw new Error('Failed to decode VIN');
  }
}

async function scrapeLinks(url: string): Promise<ScrapedLink[]> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    const links: ScrapedLink[] = [];

    $('a').each((_, element) => {
      const href = $(element).attr('href');
      let text = $(element).text().trim();

      // Remove trailing slash from text if present
      if (text.endsWith('/')) {
        text = text.slice(0, -1);
      }

      if (href && text && !text.includes('Parent Directory')) {
        let fullUrl = href;
        if (!href.startsWith('http')) {
             fullUrl = new URL(href, url).toString();
        }

        // Extract name from URL
        // Remove trailing slash if exists
        const cleanUrl = fullUrl.endsWith('/') ? fullUrl.slice(0, -1) : fullUrl;
        const lastSegment = cleanUrl.split('/').pop() || '';
        const name = decodeURIComponent(lastSegment);

        links.push({ text, url: fullUrl, name });
      }
    });

    return links;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw new Error(`Failed to scrape ${url}`);
  }
}

function findBestMatch(target: string, links: ScrapedLink[]): ScrapedLink | null {
  if (links.length === 0) return null;

  // Use 'name' for matching as it is more reliable (derived from URL)
  const candidates = links.map(l => l.name);

  // Also consider 'text' if 'name' is drastically different?
  // For now, name seems best because text can be "V6..." while name is "Camaro V6..."

  const matches = stringSimilarity.findBestMatch(target, candidates);
  const bestMatch = matches.bestMatch;

  console.log(`Matching '${target}' against candidates. Top match: ${bestMatch.target} (${bestMatch.rating})`);

  // Lower threshold a bit because "Camaro" vs "Camaro V6-3.6L" is partial match
  if (bestMatch.rating < 0.2) {
      console.warn(`Low match rating for ${target}: ${bestMatch.rating} with ${bestMatch.target}`);
  }

  return links[matches.bestMatchIndex];
}

export async function resolveCharmVehicle(vin: string): Promise<{ nhtsa_data: VehicleInfo; charm_base_url: string }> {
  // Check cache first
  if (vinCache.has(vin)) {
     const cached = vinCache.get(vin)!;
     return { nhtsa_data: cached.info, charm_base_url: cached.url };
  }

  const vehicleInfo = await getNHTSAData(vin);
  console.log('NHTSA Data:', vehicleInfo);

  // 1. Match Make
  const makeLinks = await scrapeLinks(CHARM_BASE_URL + '/');

  let makeToSearch = vehicleInfo.make;
  if (makeToSearch.toUpperCase() === 'CHEVROLET') makeToSearch = 'Chevy';

  const matchedMake = findBestMatch(makeToSearch, makeLinks);

  if (!matchedMake) {
    throw new Error(`Could not find make match for ${vehicleInfo.make}`);
  }
  console.log('Matched Make:', matchedMake.name, matchedMake.url);

  // 2. Match Year
  const yearLinks = await scrapeLinks(matchedMake.url);
  const matchedYear = findBestMatch(vehicleInfo.year, yearLinks);

  if (!matchedYear) {
      throw new Error(`Could not find year match for ${vehicleInfo.year}`);
  }
  console.log('Matched Year:', matchedYear.name, matchedYear.url);

  // 3. Match Model
  const modelLinks = await scrapeLinks(matchedYear.url);

  // Search for Model
  // If we have "Camaro", and candidates are "Camaro V6...", "Camaro V8..."
  // string-similarity should pick one of them.
  // Ideally we pick the one matching engine, but for now just picking the best string match is okay.

  const matchedModel = findBestMatch(vehicleInfo.model, modelLinks);

  if (!matchedModel) {
      throw new Error(`Could not find model match for ${vehicleInfo.model}`);
  }
  console.log('Matched Model:', matchedModel.name, matchedModel.url);

  const result = {
      nhtsa_data: vehicleInfo,
      charm_base_url: matchedModel.url
  };

  vinCache.set(vin, { info: vehicleInfo, url: matchedModel.url });
  return result;
}

export async function scrapeCharmDirectory(url: string): Promise<ScrapedLink[]> {
    return await scrapeLinks(url);
}
