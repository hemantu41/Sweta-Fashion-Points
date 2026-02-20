import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/shiprocket/test-auth
 * Debug endpoint to test Shiprocket authentication
 */
export async function GET(request: NextRequest) {
  try {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    // Check if env vars exist
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not found',
        details: {
          emailExists: !!email,
          passwordExists: !!password,
          emailValue: email ? `${email.substring(0, 3)}***` : 'NOT SET',
        },
      });
    }

    // Try to authenticate with Shiprocket
    console.log('[Shiprocket Test] Attempting authentication...');
    console.log('[Shiprocket Test] Email:', email);
    console.log('[Shiprocket Test] Password length:', password.length);

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const responseText = await response.text();
    console.log('[Shiprocket Test] Response status:', response.status);
    console.log('[Shiprocket Test] Response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        statusCode: response.status,
        statusText: response.statusText,
        shiprocketResponse: data,
        envVarsPresent: {
          email: !!email,
          password: !!password,
          emailPreview: email ? `${email.substring(0, 3)}***@***` : 'NOT SET',
          passwordLength: password?.length || 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful!',
      tokenReceived: !!data.token,
      tokenPreview: data.token ? `${data.token.substring(0, 20)}...` : 'NO TOKEN',
    });
  } catch (error: any) {
    console.error('[Shiprocket Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Test failed',
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
