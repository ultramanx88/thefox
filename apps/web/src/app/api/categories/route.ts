import { NextResponse } from 'next/server';

const MICROSERVICES_BASE = process.env.MICROSERVICES_URL || 'http://localhost:8080';

export async function GET() {
  try {
    const response = await fetch(`${MICROSERVICES_BASE}/api/categories`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}