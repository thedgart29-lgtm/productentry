import { NextResponse } from 'next/server';
import { readDB, writeDB, SupplierMaster as Supplier } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = await readDB();
  return NextResponse.json(db.suppliers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await readDB();
  
  const newSupplier: Supplier = {
    id: uuidv4(),
    name: body.name,
    contact: body.contact || '',
    address: body.address || ''
  };

  db.suppliers.push(newSupplier);
  await writeDB(db);

  return NextResponse.json(newSupplier);
}
