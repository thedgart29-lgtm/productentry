import fs from 'fs/promises';
import path from 'path';

const DB_DIR = process.env.DB_DIR ? process.env.DB_DIR : process.cwd();
const DB_PATH = path.join(DB_DIR, 'db.json');

export interface MaterialMaster {
  id: string;
  name: string;
  code: string;
  unit: string;
  threshold?: number; /* Low stock alert level */
  inwardEntries: {
    id: string;
    supplierId: string;
    quantity: number;
    date: string;
  }[];
}

export interface ProductMaster {
  id: string;
  name: string;
  code: string;
}

export interface ProductTypeMaster {
  id: string;
  productId: string;
  size: string;
  sizeUnit?: string;
  diameter?: string;
  unitWeight?: number;
  color: string;
  code: string;
  hasColor: boolean;
  isActive: boolean;
}

export interface SupplierMaster {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export interface InwardEntry {
  id: string;
  date: string;
  productId: string;
  pcs: number;
  materialId: string;
  materialQuantity: number; // Auto-calculated
  typeId: string;
  batchCode: string; // Generated: P_CODE + M_CODE + T_CODE + BATCH_NO
  coordinatorId: string; // ID of the employee who created the batch
  notes: string;
}

export interface EmployeeMaster {
  id: string;
  name: string;
  idCode: string;
  designation: string;
  password?: string;
  avatar?: string;
}

export interface Part {
  id: string;
  name: string;
  code: string;
  unit: string;
}

export interface StockEntry {
  id: string;
  itemId: string;
  itemType: 'material' | 'part';
  supplierId: string | null;
  quantity: number;
  date: string;
  type: string;
  batchCode?: string;
  notes?: string;
}

export interface DB {
  materials: MaterialMaster[];
  products: ProductMaster[];
  types: ProductTypeMaster[];
  suppliers: SupplierMaster[];
  employees: EmployeeMaster[];
  parts: Part[];
  entries: StockEntry[];
  inwards: InwardEntry[]; // Keeping for legacy if needed, but 'entries' is used now
}

export async function readDB(): Promise<DB> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const db = JSON.parse(data);
    return {
      materials: [],
      products: [],
      types: [],
      suppliers: [],
      employees: [],
      parts: [],
      entries: [],
      inwards: [],
      ...db
    };
  } catch (error) {
    return { 
      materials: [], 
      products: [], 
      types: [], 
      suppliers: [], 
      employees: [],
      parts: [],
      entries: [],
      inwards: []
    };
  }
}

export async function writeDB(data: DB): Promise<void> {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (err) {
    // ignore
  }
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}
