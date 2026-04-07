import { NextResponse } from 'next/server';
import { readDB, writeDB, MaterialMaster as Material } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = await readDB();
  return NextResponse.json(db.materials);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await readDB();
  
  const newMaterial: Material = {
    id: uuidv4(),
    name: body.name,
    code: body.code.toUpperCase(),
    unit: body.unit || 'pcs',
    inwardEntries: []
  };

  db.materials.push(newMaterial);
  await writeDB(db);

  return NextResponse.json(newMaterial);
}
