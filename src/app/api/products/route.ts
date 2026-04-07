import { NextResponse } from 'next/server';
import { readDB, writeDB, ProductMaster as Product } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = await readDB();
  return NextResponse.json(db.products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await readDB();
  
  const newProduct: Product = {
    id: uuidv4(),
    name: body.name,
    code: body.code.toUpperCase()
  };

  db.products.push(newProduct);
  await writeDB(db);

  return NextResponse.json(newProduct);
}
