
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      `SELECT 
        c.id, c.student_id, c.officer_name, c.tinsel_day, c.food_claimed, c.claimed_at,
        s.first_name, s.last_name
       FROM claims c
       JOIN existing_student_info s ON c.student_id = s.student_id
       ORDER BY c.claimed_at DESC 
       LIMIT 10`
    );
    
    connection.release();

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching recent claims:', error);
    return NextResponse.json({ message: 'An error occurred while fetching recent claims.' }, { status: 500 });
  }
}
