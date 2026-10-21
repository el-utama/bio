#!/usr/bin/env node
/**
 * Apply URLs from CSV to catalog.json
 * 
 * Usage:
 *   node scripts/apply-urls.cjs [urls-csv-file] [catalog-file] [output-file]
 */

const fs = require('fs');
const path = require('path');

function normalizeTitle(title) {
  return title.toLowerCase().trim().replace(/[.,!?]/g, '').replace(/\s+/g, ' ');
}

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const tracks = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && (j === 0 || line[j-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (j === line.length - 1 || line[j+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim().replace(/^"|"$/g, ''));
    
    if (fields.length >= 5) {
      tracks.push({
        title: fields[0],
        released: fields[1],
        spotify: fields[2] || '',
        youtube: fields[3] || '',
        apple: fields[4] || ''
      });
    }
  }
  return tracks;
}

function main() {
  const args = process.argv.slice(2);
  const urlsFile = args[0] || './scripts/missing-urls-filled.csv';
  const catalogFile = args[1] || './catalog.json';
  const outputFile = args[2] || './catalog.json';
  
  if (!fs.existsSync(urlsFile)) {
    console.error(`File not found: ${urlsFile}`);
    console.log('Create it from scripts/missing-urls-template.csv');
    process.exit(1);
  }
  
  const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
  const csvContent = fs.readFileSync(urlsFile, 'utf8');
  const urlTracks = parseCSV(fs.readFileSync(urlsFile, 'utf8'));
  
  console.log(`Catalog: ${require(catalogFile).length} tracks`);
  console.log(`URL entries: ${urlTracks.length}`);
  
  let matched = 0;
  let updated = 0;
  
  for (const urlTrack of urlTracks) {
    if (!urlTrack.spotify && !urlTrack.youtube && !urlTrack.apple) continue;
    
    const csvTitle = urlTrack.title.toLowerCase().trim();
    let match = null;
    
    for (const catTrack of require(catalogFile)) {
      if (catTrack.title.toLowerCase().trim() === urlTrack.title.toLowerCase().trim()) {
        match = catTrack;
        break;
      }
    }
    
    if (!match) {
      console.log(`  ⚠ No match for: ${urlTrack.title}`);
      continue;
    }
    
    let trackUpdated = false;
    if (urlTrack.spotify && !match.spotify) { match.spotify = urlTrack.spotify; updated++; trackUpdated = true; }
    if (urlTrack.youtube && !match.youtube) { match.youtube = urlTrack.youtube; updated++; trackUpdated = true; }
    if (urlTrack.apple && !match.apple) { match.apple = urlTrack.apple; updated++; trackUpdated = true; }
    
    if (trackUpdated) {
      matched++;
      console.log(`  ✓ ${match.title}: ${urlTrack.spotify ? 'S' : ''}${urlTrack.youtube ? 'Y' : ''}${urlTrack.apple ? 'A' : ''}`);
    }
  }
  
  console.log(`\nMatched: ${matched}, Fields updated: ${updated}`);
  
  // Re-sort by release_date desc
  const catalog = require(catalogFile);
  catalog.sort((a, b) => {
    const da = a.released ? new Date(a.released) : new Date(0);
    const db = b.released ? new Date(b.released) : new Date(0);
    return db - da;
  });
  
  fs.writeFileSync('./catalog.json', JSON.stringify(require(catalogFile), null, 2));
  console.log('Updated catalog.json');
}

require('./catalog.json'); // Ensure file exists
console.log('Ready. Usage: node scripts/apply-urls.cjs [urls-csv-file]');