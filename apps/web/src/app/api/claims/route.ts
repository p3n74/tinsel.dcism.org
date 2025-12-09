
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionData } from '@/lib/session';
import { emailService } from '@/lib/email';

export async function POST(req: NextRequest) {
  const session = await getSessionData(req);

  if (!session.isLoggedIn || !session.officerName) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { student_id } = await req.json();

  if (!student_id) {
    return NextResponse.json({ message: 'student_id is required.' }, { status: 400 });
  }

  try {
    const connection = await pool.getConnection();

    // Get current day
    const [configRows]: [any[], any] = await connection.execute('SELECT setting_value FROM tinsel_config WHERE setting_key = "current_day"');
    if (configRows.length === 0) {
      connection.release();
      return NextResponse.json({ message: 'Current day is not configured.' }, { status: 500 });
    }
    const currentDay = parseInt(configRows[0].setting_value, 10);

    // Check for existing claim
    const [claimRows]: [any[], any] = await connection.execute(
      'SELECT id FROM claims WHERE student_id = ? AND tinsel_day = ?',
      [student_id, currentDay]
    );

    if (claimRows.length > 0) {
      connection.release();
      return NextResponse.json({ message: 'Student has already claimed for today.' }, { status: 409 });
    }

    // Get food for the day
    const [foodRows]: [any[], any] = await connection.execute('SELECT food_of_the_day FROM tinsel_days WHERE day_number = ?', [currentDay]);
    if (foodRows.length === 0) {
        connection.release();
        return NextResponse.json({ message: 'Food for the current day is not configured.' }, { status: 500 });
    }
    const foodOfTheDay = foodRows[0].food_of_the_day;

    // Insert new claim
    const [insertResult]:[any, any] = await connection.execute(
      'INSERT INTO claims (student_id, officer_name, tinsel_day, food_claimed) VALUES (?, ?, ?, ?)',
      [student_id, session.officerName, currentDay, foodOfTheDay]
    );

    // To avoid fetching student info twice, fetch it once for both email and websocket
    let studentInfo = { email: '', first_name: '', last_name: '' };
    try {
        const [studentRows]: [any[], any] = await connection.execute('SELECT email, first_name, last_name FROM existing_student_info WHERE student_id = ?', [student_id]);
        if (studentRows.length > 0) {
            studentInfo = studentRows[0];
        }
    } catch (error) {
        console.error('Error fetching student info:', error);
    }

    // Trigger websocket
    const newClaim = {
      id: insertResult.insertId,
      student_id,
      officer_name: session.officerName,
      tinsel_day: currentDay,
      food_claimed: foodOfTheDay,
      first_name: studentInfo.first_name,
      last_name: studentInfo.last_name,
    };

    try {
      await fetch('http://localhost:3001/api/new-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClaim),
      });
    } catch (error) {
      console.error('Error notifying websocket server:', error);
      // Don't block the response for this, just log it
    }

    // Send email
    if (studentInfo.email) {
      try {
          await emailService.sendTinselTreatsClaimedEmail({
            email: studentInfo.email,
            studentName: studentInfo.first_name,
            foodClaimed: foodOfTheDay,
            officerName: session.officerName,
          });
      } catch (error) {
          console.error('Error sending email:', error);
      }
    }


    connection.release();
    
    return NextResponse.json({ message: 'Claim processed successfully.', claim: newClaim });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'An error occurred while processing the claim.' }, { status: 500 });
  }
}
