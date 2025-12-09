
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ message: 'Search query is required.' }, { status: 400 });
  }

  try {
    const connection = await pool.getConnection();

    // 1. Get current day
    const [configRows]: [any[], any] = await connection.execute('SELECT setting_value FROM tinsel_config WHERE setting_key = "current_day"');
    if (configRows.length === 0) {
      connection.release();
      return NextResponse.json({ message: 'Current day is not configured.' }, { status: 500 });
    }
    const currentDay = parseInt(configRows[0].setting_value, 10);
    
    // 2. Search for students with claim status
    const sqlQuery = `
      SELECT DISTINCT 
        s.student_id, 
        s.first_name, 
        s.last_name, 
        s.middle_name, 
        s.program, 
        s.email,
        c.id IS NOT NULL AS isClaimed,
        c.officer_name AS claimedByOfficer
      FROM 
        existing_student_info s
      LEFT JOIN 
        claims c ON s.student_id = c.student_id AND c.tinsel_day = ?
      WHERE 
        s.first_name LIKE ? OR 
        s.last_name LIKE ? OR 
        s.student_id = ?
    `;
    
    const [rows] = await connection.execute(sqlQuery, [currentDay, `%${query}%`, `%${query}%`, query]);
    
    connection.release();

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'An error occurred while searching.' }, { status: 500 });
  }
}
