import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const db = await readDB();
  
  switch(type) {
    case 'materials': return NextResponse.json(db.materials);
    case 'products': return NextResponse.json(db.products);
    case 'types': return NextResponse.json(db.types);
    case 'suppliers': return NextResponse.json(db.suppliers);
    case 'employees': return NextResponse.json(db.employees);
    default: return NextResponse.json(db);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { type, action } = body;
  const db = await readDB();
  
  if (action === 'delete') {
    if (type === 'material') db.materials = db.materials.filter(m => m.id !== body.id);
    if (type === 'product') db.products = db.products.filter(p => p.id !== body.id);
    if (type === 'productType') db.types = db.types.filter(t => t.id !== body.id);
    if (type === 'supplier') db.suppliers = db.suppliers.filter(s => s.id !== body.id);
    if (type === 'employee') db.employees = db.employees.filter(e => e.id !== body.id);
    await writeDB(db);
    return NextResponse.json({ success: true });
  }

  if (action === 'update') {
    if (type === 'material') {
      const idx = db.materials.findIndex(m => m.id === body.id);
      if (idx !== -1) db.materials[idx] = { ...db.materials[idx], name: body.name, code: body.code.toUpperCase(), unit: body.unit, threshold: Number(body.threshold) || 0 };
    }
    if (type === 'product') {
      const idx = db.products.findIndex(p => p.id === body.id);
      if (idx !== -1) db.products[idx] = { ...db.products[idx], name: body.name, code: body.code.toUpperCase() };
    }
    if (type === 'productType') {
      const idx = db.types.findIndex(t => t.id === body.id);
      if (idx !== -1) db.types[idx] = { ...db.types[idx], productId: body.productId, size: body.size, sizeUnit: body.sizeUnit, diameter: body.diameter, unitWeight: Number(body.unitWeight) || 0, color: body.color, code: body.code.toUpperCase(), hasColor: body.hasColor };
    }
    if (type === 'supplier') {
      const idx = db.suppliers.findIndex(s => s.id === body.id);
      if (idx !== -1) db.suppliers[idx] = { ...db.suppliers[idx], name: body.name, contact: body.contact, address: body.address };
    }
    if (type === 'employee') {
      const idx = db.employees.findIndex(e => e.id === body.id);
      if (idx !== -1) db.employees[idx] = { ...db.employees[idx], name: body.name, idCode: body.idCode.toUpperCase(), designation: body.designation, password: body.password, avatar: body.avatar || "" };
    }
    await writeDB(db);
    return NextResponse.json({ success: true });
  }

  if (type === 'material') {
    if (action === 'inward') {
      const material = db.materials.find(m => m.id === body.materialId);
      if (material) {
        material.inwardEntries.push({
          id: uuidv4(),
          supplierId: body.supplierId,
          quantity: Number(body.quantity),
          date: body.date
        });
      }
    } else {
      db.materials.push({
        id: uuidv4(),
        name: body.name,
        code: body.code.toUpperCase(),
        unit: body.unit,
        threshold: Number(body.threshold) || 0,
        inwardEntries: []
      });
    }
  } else if (type === 'product') {
    db.products.push({
      id: uuidv4(),
      name: body.name,
      code: body.code.toUpperCase()
    });
  } else if (type === 'productType') {
    if (action === 'toggleStatus') {
      const typeItem = db.types.find(t => t.id === body.id);
      if (typeItem) {
        typeItem.isActive = !typeItem.isActive;
      }
    } else {
      db.types.push({
          id: uuidv4(),
          productId: body.productId,
          size: body.size,
          sizeUnit: body.sizeUnit || 'MM',
          diameter: body.diameter,
          unitWeight: Number(body.unitWeight) || 0,
          color: body.color,
          code: body.code.toUpperCase(),
          hasColor: body.hasColor,
          isActive: true
      });
    }
  } else if (type === 'supplier') {
    db.suppliers.push({
      id: uuidv4(),
      name: body.name,
      contact: body.contact,
      address: body.address
    });
  } else if (type === 'employee') {
    db.employees.push({
      id: uuidv4(),
      name: body.name,
      idCode: body.idCode.toUpperCase(),
      designation: body.designation,
      password: body.password || "123456",
      avatar: body.avatar || ""
    });
  }

  await writeDB(db);
  return NextResponse.json({ success: true });
}
