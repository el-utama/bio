const cat = require('../catalog.json');
const missing = cat.filter(t => t.kind === 'song' && (!t.spotify || !t.youtube || !t.apple));
console.log('Missing URLs:', missing.length);
missing.forEach(t => {
  const m = [];
  if (!t.spotify) m.push('S');
  if (!t.youtube) m.push('Y');
  if (!t.apple) m.push('A');
  console.log('  -', t.title, '[' + m.join(',') + ']', t.released);
});