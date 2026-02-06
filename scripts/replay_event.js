require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function main(){
  const id = process.argv[2];
  if(!id){ console.error('Usage: node scripts/replay_event.js <raw_event_id>'); process.exit(2); }
  const res = await fetch('http://localhost:3000/api/debug/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: Number(id) }) });
  const json = await res.json();
  console.log('replay result', json);
}

main().catch(e=>{ console.error(e); process.exit(1); });
