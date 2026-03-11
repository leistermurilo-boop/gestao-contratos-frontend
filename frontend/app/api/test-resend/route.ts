import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY not configured'
      }, { status: 500 });
    }

    const { data, error } = await resend.emails.send({
      from: 'teste@duogovernance.com.br',
      to: ['leistermurilo@gmail.com'],
      subject: '✅ DUO Governance - Resend Test Successful',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Success!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #1f2937;">Resend is working correctly!</h2>
              <p style="color: #4b5563;">DUO Governance is ready to send transactional emails and newsletters.</p>
              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                <p style="margin: 5px 0;"><strong>✅ Domain:</strong> duogovernance.com.br</p>
                <p style="margin: 5px 0;"><strong>✅ Status:</strong> Verified</p>
                <p style="margin: 5px 0;"><strong>✅ Limit:</strong> 100 emails/day</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    console.log('Email sent successfully:', data);
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error'
    }, { status: 500 });
  }
}
