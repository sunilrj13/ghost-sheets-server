import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, hardwareId, deviceName } = body;

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
    
    if (existingDevice) {
      if (existingDevice.isRevoked) {
        return NextResponse.json({ success: false, message: 'This device has been revoked' }, { status: 403 });
      }
      
      // Update last active
      await pool.query('UPDATE Device SET lastActive = ? WHERE id = ?', [new Date(), existingDevice.id]);
      
      return NextResponse.json({ success: true, message: 'License activated successfully' });
    }

    // New device, check limit (count only active devices)
    const activeDevicesCount = deviceRows.filter(d => !d.isRevoked).length;

    if (activeDevicesCount >= license.maxDevices) {
      return NextResponse.json({ success: false, message: 'Device limit reached for this license' }, { status: 403 });
    }

    // Add new device
    const deviceId = uuidv4();
    await pool.query(
      'INSERT INTO Device (id, licenseId, hardwareId, deviceName) VALUES (?, ?, ?, ?)',
      [deviceId, license.id, hardwareId, deviceName || 'Unknown Device']
    );

    return NextResponse.json({ success: true, message: 'License activated successfully on new device' });

  } catch (error: any) {
    console.error('Activation Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
