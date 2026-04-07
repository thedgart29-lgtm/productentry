import { NextResponse } from 'next/server';
import { readDB, writeDB, StockEntry } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = await readDB();
  return NextResponse.json(db.entries);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await readDB();
  
  const newEntry: StockEntry = {
    id: uuidv4(),
    itemId: body.itemId,
    itemType: body.itemType || 'material',
    supplierId: body.supplierId || null,
    quantity: Number(body.quantity),
    date: body.date,
    type: body.type || 'arrival',
    batchCode: body.batchCode || '',
    notes: body.notes || ''
  };

  db.entries.push(newEntry);
  await writeDB(db);

  return NextResponse.json(newEntry);
}
