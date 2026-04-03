import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logEntry = await request.json();
    
    // Validate log entry
    if (!logEntry.timestamp || !logEntry.level || !logEntry.message) {
      return NextResponse.json({ error: 'Invalid log entry' }, { status: 400 });
    }

    // In production, store to database or file system
    console.log('Log received:', logEntry);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to store log:', error);
    return NextResponse.json({ error: 'Failed to store log' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // In production, read from database or file system
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        category: 'system',
        message: 'Application started',
        metadata: { version: '1.0.0' }
      }
    ];

    return NextResponse.json({ logs: mockLogs, total: mockLogs.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read logs' }, { status: 500 });
  }
}