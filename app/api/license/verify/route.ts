import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, hardwareId } = body;

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

    // Check if device is linked and not revoked
    const existingDevice = license.devices.find(d => d.hardwareId === hardwareId);
    
    if (!existingDevice) {
      return NextResponse.json({ success: false, message: 'Device not linked to this license' }, { status: 403 });
    }

    if (existingDevice.isRevoked) {
      return NextResponse.json({ success: false, message: 'This device has been revoked' }, { status: 403 });
    }

    // Update last active
    await prisma.device.update({
      where: { id: existingDevice.id },
      data: { lastActive: new Date() }
    });

    return NextResponse.json({ success: true, message: 'License verified' });

  } catch (error: any) {
    console.error('Verify Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
