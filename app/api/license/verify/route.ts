import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, hardwareId } = body;

    if (!key || !hardwareId) {
      return NextResponse.json({ success: false, message: 'Missing key or hardwareId' }, { status: 400 });
    }

    const [licenseRows] = await pool.query<RowDataPacket[]>('SELECT * FROM License WHERE `key` = ?', [key]);

    if (licenseRows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid License Key' }, { status: 404 });
    }

    const license = licenseRows[0];

    if (license.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, message: `License is ${license.status}` }, { status: 403 });
    }

    if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
      return NextResponse.json({ success: false, message: 'License has expired' }, { status: 403 });
    }

    // Check devices
    const [deviceRows] = await pool.query<RowDataPacket[]>('SELECT * FROM Device WHERE licenseId = ?', [license.id]);
    
    const existingDevice = deviceRows.find(d => d.hardwareId === hardwareId);
    
    if (!existingDevice) {
      return NextResponse.json({ success: false, message: 'Device not linked to this license' }, { status: 403 });
    }

    if (existingDevice.isRevoked) {
      return NextResponse.json({ success: false, message: 'This device has been revoked' }, { status: 403 });
    }

    // Update last active
    await pool.query('UPDATE Device SET lastActive = ? WHERE id = ?', [new Date(), existingDevice.id]);

    return NextResponse.json({ success: true, message: 'License verified' });

  } catch (error: any) {
    console.error('Verify Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
