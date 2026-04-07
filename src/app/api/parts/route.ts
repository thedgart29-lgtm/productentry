import { NextResponse } from 'next/server';
import { readDB, writeDB, Part } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = await readDB();
  return NextResponse.json(db.parts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await readDB();
  
  const newPart: Part = {
    id: uuidv4(),
    name: body.name,
    code: body.code.toUpperCase(),
    unit: body.unit || 'pcs'
  };

  db.parts.push(newPart);
  await writeDB(db);

  return NextResponse.json(newPart);
}
