import { NextResponse } from 'next/server';
import { readDB, writeDB, InwardEntry } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = await readDB();
  return NextResponse.json(db.inwards);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = await readDB();
  
  const product = db.products.find(p => p.id === body.productId);
  const material = db.materials.find(m => m.id === body.materialId);
  const type = db.types.find(t => t.id === body.typeId);
  
  if (!product || !material || !type) {
    return NextResponse.json({ error: 'Missing product, material or type info' }, { status: 400 });
  }

  const batchNo = (db.inwards.length + 1).toString().padStart(3, '0');
  const batchCode = `${product.code}-${material.code}-${type.code}-${batchNo}`.toUpperCase();

  const newEntry: InwardEntry = {
    id: uuidv4(),
    date: body.date || new Date().toISOString().split('T')[0],
    productId: body.productId,
    pcs: Number(body.pcs),
    materialId: body.materialId,
    materialQuantity: Number(body.materialQuantity),
    typeId: body.typeId,
    batchCode: batchCode,
    coordinatorId: body.coordinatorId || '',
    notes: body.notes || ''
  };

  db.inwards.push(newEntry);
  await writeDB(db);

  return NextResponse.json(newEntry);
}
export async function PUT(request: Request) {
  const body = await request.json();
  const db = await readDB();
  const idx = db.inwards.findIndex(i => i.id === body.id);
  
  if (idx !== -1) {
    const entry = db.inwards[idx];
    const type = db.types.find(t => t.id === (body.typeId || entry.typeId));
    const unitWeight = type?.unitWeight || 0;
    
    db.inwards[idx] = {
      ...entry,
      date: body.date || entry.date,
      productId: body.productId || entry.productId,
      pcs: body.pcs !== undefined ? Number(body.pcs) : entry.pcs,
      materialId: body.materialId || entry.materialId,
      materialQuantity: body.pcs !== undefined ? (Number(body.pcs) * unitWeight) / 1000 : entry.materialQuantity,
      typeId: body.typeId || entry.typeId,
      notes: body.notes !== undefined ? body.notes : entry.notes
    };
    
    await writeDB(db);
    return NextResponse.json(db.inwards[idx]);
  }
  
  return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const id = body.id;
  const db = await readDB();
  
  if (id) {
    db.inwards = db.inwards.filter(i => i.id !== id);
    await writeDB(db);
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
}
