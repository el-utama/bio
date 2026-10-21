#!/usr/bin/env node
/**
 * CSV → Catalog Converter
 * 
 * Usage:
 *   node scripts/csv-to-catalog.js [csv-file] [catalog-file] [output-file]
 * 
 * Reads Spotify for Artists CSV export, matches with existing catalog,
 * and outputs updated catalog.json with new tracks.
 */

const fs = require('fs');
const path = require('path');

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[.,!?]/g, '')
    .replace(/\s+/g, ' ');
}

function fuzzyMatch(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (na === nb) return true;
  // Handle common variations
  if (na.replace(/[^a-z0-9]/g, '') === nb.replace(/[^a-z0-9]/g, '')) return true;
  return false;
}

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const tracks = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle quoted fields with commas
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
        listeners: parseInt(fields[1]) || 0,
        streams: parseInt(fields[2]) || 0,
        saves: parseInt(fields[3]) || 0,
        release_date: fields[4]
      });
    }
  }
  return tracks;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function findMatchingTrack(catalog, csvTrack) {
  const csvTitle = csvTrack.title.toLowerCase().trim();
  
  // Exact match
  for (const catTrack of catalog) {
    if (catTrack.title.toLowerCase().trim() === csvTitle) {
      return catTrack;
    }
  }
  
  // Fuzzy match
  for (const catTrack of catalog) {
    if (fuzzyMatch(catTrack.title, csvTrack.title)) {
      return catTrack;
    }
  }
  
  return null;
}

function main() {
  const args = process.argv.slice(2);
  const csvFile = args[0] || '/Users/itoy4u/Downloads/Manual Library/eL Utama-songs-1year.csv';
  const catalogFile = args[1] || './catalog.json';
  const outputFile = args[2] || './catalog.json';
  
  console.log('Reading catalog...');
  const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
  
  console.log('Reading CSV...');
  const csvContent = fs.readFileSync(csvFile, 'utf8');
  const csvTracks = parseCSV(csvContent);
  
  console.log(`Catalog: ${catalog.length} tracks`);
  console.log(`CSV: ${csvTracks.length} tracks`);
  
  const existingBySlug = new Map();
  catalog.forEach(t => existingBySlug.set(t.slug, t));
  
  let updated = 0;
  let added = 0;
  let skipped = 0;
  
  for (const csvTrack of csvTracks) {
    const match = findMatchingTrack(catalog, csvTrack);
    
    if (match) {
      // Update release_date if CSV has newer info
      if (csvTrack.release_date && csvTrack.release_date !== match.release_date) {
        console.log(`  ~ Updated release_date: ${match.title} (${match.release_date} → ${csvTrack.release_date})`);
        match.release_date = csvTrack.release_date;
        updated++;
      } else {
        skipped++;
      }
    } else {
      // New track - needs manual URL entry
      const slug = slugify(csvTrack.title);
      const newTrack = {
        slug,
        title: csvTrack.title,
        released: csvTrack.release_date,
        spotify: '',  // TODO: Find Spotify URL
        youtube: '',  // TODO: Find YouTube Music URL
        apple: '',    // TODO: Find Apple Music URL
        cover: '',
        kind: 'song'
      };
      catalog.push(newTrack);
      console.log(`  + Added: ${csvTrack.title} (${csvTrack.release_date}) - NEEDS URLs`);
      added++;
    }
  }
  
  // Sort by release_date desc
  catalog.sort((a, b) => {
    const da = a.released ? new Date(a.released) : new Date(0);
    const db = b.released ? new Date(b.released) : new Date(0);
    return db - da;
  });
  
  // Re-filter eligible
  const platforms = ['spotify', 'youtube', 'apple'];
  const eligible = catalog.filter(t => 
    t.kind === 'song' && platforms.every(p => t[p] && t[p].startsWith('http'))
  );
  
  console.log(`\nResults:`);
  console.log(`  Total: ${catalog.length}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Added: ${added}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Eligible (3 platforms): ${eligible.length}`);
  
  // Show tracks missing URLs
  const missingUrls = catalog.filter(t => t.kind === 'song' && (!t.spotify || !t.youtube || !t.apple));
  if (missingUrls.length > 0) {
    console.log(`\nTracks needing URLs (${missingUrls.length}):`);
    missingUrls.forEach(t => {
      const missing = [];
      if (!t.spotify) missing.push('Spotify');
      if (!t.youtube) missing.push('YouTube');
      if (!t.apple) missing.push('Apple');
      console.log(`  - ${t.title}: ${missing.join(', ')}`);
    });
  }
  
  // Write output
  fs.writeFileSync(outputFile, JSON.stringify(catalog, null, 2));
  console.log(`\nWritten to ${outputFile}`);
}

main();