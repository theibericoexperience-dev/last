const fs = require('fs');

const content = fs.readFileSync('app/tour/TourClient.tsx', 'utf8');
const lines = content.split('\n');

// A very naive script just to print out braces and tags starting at 1725...
for(let i=1725; i<1755; i++) {
  console.log(i+1, lines[i].trim());
}
