const fs = require('fs');

const content = fs.readFileSync('app/tour/TourClient.tsx', 'utf8');
const lines = content.split('\n');

// A very naive script just to print out the divs starting at 1650 and ending at 2235
let depth = 0;
for(let i=1650; i<2230; i++) {
  const line = lines[i];
  const openCount = (line.match(/<div/g) || []).length;
  const closeCount = (line.match(/<\/div>/g) || []).length;
  
  if (openCount > 0 || closeCount > 0) {
      if (closeCount > openCount) {
         depth -= (closeCount - openCount);
         console.log(i+1, "   ".repeat(Math.max(0, depth)) + line.trim());
      } else if (openCount > closeCount) {
         console.log(i+1, "   ".repeat(Math.max(0, depth)) + line.trim());
         depth += (openCount - closeCount);
      } else {
         console.log(i+1, "   ".repeat(Math.max(0, depth)) + line.trim());
      }
  }
}
