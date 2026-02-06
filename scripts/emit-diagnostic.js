const fs = require('fs');
const path = require('path');
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'diagnostic.log');
(async ()=>{
  try{
    await fs.promises.mkdir(LOG_DIR, { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), payload: { test: true, msg: 'script test' } }) + '\n';
    await fs.promises.appendFile(LOG_FILE, line, { encoding: 'utf8' });
    console.log('Wrote test diagnostic to', LOG_FILE);
  }catch(e){ console.error('Failed', e); process.exit(1); }
})();
