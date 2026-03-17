const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Emeka100@localhost:5433/intra?schema=public',
});

async function main() {
  await client.connect();

  const res = await client.query('SELECT id, name, email FROM "User" WHERE name ILIKE $1', ['%Jane%']);
  
  if (res.rows.length > 0) {
    const jane = res.rows[0];
    console.log(`Setting ${jane.name} to offline...`);
    
    await client.query('UPDATE "User" SET "isOnline" = false WHERE id = $1', [jane.id]);
    console.log('Update successful.');
  } else {
    console.log("Jane not found. Setting all 'AGENT' users to offline instead.");
    await client.query('UPDATE "User" SET "isOnline" = false WHERE role = $1', ['AGENT']);
    console.log('All agents set to offline.');
  }

  await client.end();
}

main().catch(console.error);
