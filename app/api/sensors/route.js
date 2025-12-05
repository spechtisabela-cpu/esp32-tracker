import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export async function POST(request) {
  let client;
  try {
    const body = await request.json();
    
    // Recebe nomes CURTOS do Arduino
    const { 
      lat, lng, temp, hum, mq9, mq135, 
      co, alcohol, co2, toluene, nh4, acetone 
    } = body;

    client = await pool.connect();
    
    // Salva nos nomes LONGOS do Banco
    await client.query(
      `INSERT INTO sensor_data (
          latitude, longitude, temp, humidity, mq9_val, mq135_val,
          mq135_co, mq135_alcohol, mq135_co2, mq135_toluene, mq135_nh4, mq135_acetone
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [lat||0, lng||0, temp||0, hum||0, mq9||0, mq135||0, co||0, alcohol||0, co2||0, toluene||0, nh4||0, acetone||0]
    );

    return NextResponse.json({ message: 'Salvo' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

export async function GET() {
  let client;
  try {
    client = await pool.connect();
    // AQUI: MUDAMOS DE 100 PARA 1000 PARA VER O HISTÓRICO DE ONTEM
    const result = await client.query('SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 1000');
    
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');
    return NextResponse.json({ data: result.rows }, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
