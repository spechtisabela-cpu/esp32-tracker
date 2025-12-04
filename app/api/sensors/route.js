import { Pool } from 'pg';
import { NextResponse } from 'next/server';

// Connect using the URL provided by Supabase in Vercel Env Vars
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});

export async function POST(request) {
  let client;
  try {
    const body = await request.json();
    const { lat, lng, temp, hum, mq9, mq135 } = body;

    client = await pool.connect();
    
    // Insert Data
    await client.query(
      'INSERT INTO sensor_data (latitude, longitude, temp, humidity, mq9_val, mq135_val) VALUES ($1, $2, $3, $4, $5, $6)',
      [lat, lng, temp, hum, mq9, mq135]
    );

    return NextResponse.json({ message: 'Data Saved' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

export async function GET() {
  let client;
  try {
    client = await pool.connect();
    // Get last 100 readings
    const result = await client.query('SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 100');
    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
