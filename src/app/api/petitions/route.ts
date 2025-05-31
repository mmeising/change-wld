import { NextRequest, NextResponse } from 'next/server';

// Global array to store petitions on the server
let petitions: { title: string; description: string; signatures: number }[] = [];

export async function GET() {
  return NextResponse.json(petitions);
}

export async function POST(req: NextRequest) {
  const { title, description } = await req.json();
  if (!title || !description) {
    return NextResponse.json({ error: 'Missing title or description' }, { status: 400 });
  }
  const newPetition = { title, description, signatures: 0 };
  petitions.push(newPetition);
  return NextResponse.json(newPetition, { status: 201 });
} 