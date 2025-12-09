
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionData } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSessionData(req);
  if (!session.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const connection = await pool.getConnection();

    const [days]:[any[], any] = await connection.execute('SELECT * FROM tinsel_days ORDER BY day_number');
    const [config]:[any[], any] = await connection.execute('SELECT * FROM tinsel_config');
    
    connection.release();

    const settings = {
      days,
      config: config.reduce((acc, c) => ({ ...acc, [c.setting_key]: c.setting_value }), {})
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'An error occurred while fetching settings.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    const session = await getSessionData(req);
    if (!session.isAdmin) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { days, config } = await req.json();

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        for (const day of days) {
            await connection.execute('UPDATE tinsel_days SET food_of_the_day = ? WHERE day_number = ?', [day.food_of_the_day, day.day_number]);
        }

        for (const key in config) {
            await connection.execute('UPDATE tinsel_config SET setting_value = ? WHERE setting_key = ?', [config[key], key]);
        }

        await connection.commit();
        connection.release();

        return NextResponse.json({ message: 'Settings updated successfully.' });

    } catch (error) {
        console.error(error);
        // In a real app, you'd rollback the transaction on error
        return NextResponse.json({ message: 'An error occurred while updating settings.' }, { status: 500 });
    }
}
