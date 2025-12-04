import { Pool } from 'pg';
import { NextResponse } from 'next/server';

// Connect to Supabase
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export async function POST(request) {
  let client;
  try {
    const body = await request.json();
    
    // Destructure all the incoming data, including new gases
    // We set defaults to 0 just in case the ESP32 misses one
    const { 
      lat, lng, temp, hum, mq9, 
      mq135, // This stays as the "General/Average" value
      co = 0, alcohol = 0, co2 = 0, toluene = 0, nh4 = 0, acetone = 0 
    } = body;

    client = await pool.connect();
    
    // Insert Data into the new columns
    await client.query(
      `INSERT INTO sensor_data (
          latitude, longitude, temp, humidity, mq9_val, mq135_val,
          mq135_co, mq135_alcohol, mq135_co2, mq135_toluene, mq135_nh4, mq135_acetone
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [lat, lng, temp, hum, mq9, mq135, co, alcohol, co2, toluene, nh4, acetone]
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
