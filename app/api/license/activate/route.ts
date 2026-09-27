import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, hardwareId, deviceName } = body;

    if (!key || !hardwareId) {
      return NextResponse.json({ success: false, message: 'Missing key or hardwareId' }, { status: 400 });
    }

    const license = await prisma.license.findUnique({
      where: { key },
      include: { devices: true }
    });

    if (!license) {
      return NextResponse.json({ success: false, message: 'Invalid License Key' }, { status: 404 });
    }

    if (license.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, message: `License is ${license.status}` }, { status: 403 });
    }

    if (license.expiresAt && new Date() > license.expiresAt) {
      return NextResponse.json({ success: false, message: 'License has expired' }, { status: 403 });
    }

    // Check if device is already linked
    const existingDevice = license.devices.find(d => d.hardwareId === hardwareId);
    
    if (existingDevice) {
      if (existingDevice.isRevoked) {
        return NextResponse.json({ success: false, message: 'This device has been revoked' }, { status: 403 });
      }
      
      // Update last active
      await prisma.device.update({
        where: { id: existingDevice.id },
        data: { lastActive: new Date() }
      });
      
      return NextResponse.json({ success: true, message: 'License activated successfully' });
    }

    // New device, check limit (count only active devices)
    const activeDevicesCount = license.devices.filter(d => !d.isRevoked).length;

    if (activeDevicesCount >= license.maxDevices) {
      return NextResponse.json({ success: false, message: 'Device limit reached for this license' }, { status: 403 });
    }

    // Add new device
    await prisma.device.create({
      data: {
        licenseId: license.id,
        hardwareId,
        deviceName: deviceName || 'Unknown Device'
      }
    });

    return NextResponse.json({ success: true, message: 'License activated successfully on new device' });

  } catch (error: any) {
    console.error('Activation Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
