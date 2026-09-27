'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function generateKey(formData: FormData) {
  const customerName = formData.get('customerName') as string;
  const maxDevices = parseInt(formData.get('maxDevices') as string) || 1;
  const expiresAt = formData.get('expiresAt') as string;

  // Generate unique key format: GHOST-XXXX-XXXX-XXXX
  const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  const key = `GHOST-${randomPart()}-${randomPart()}-${randomPart()}`;

  await prisma.license.create({
    data: {
      key,
      customerName: customerName || 'Unknown',
      maxDevices,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      status: 'ACTIVE'
    }
  });

  revalidatePath('/');
}

export async function revokeLicense(id: string) {
  await prisma.license.update({
    where: { id },
    data: { status: 'REVOKED' }
  });
  revalidatePath('/');
}

export async function activateLicenseAgain(id: string) {
  await prisma.license.update({
    where: { id },
    data: { status: 'ACTIVE' }
  });
  revalidatePath('/');
}

export async function deleteLicense(id: string) {
  await prisma.license.delete({
    where: { id }
  });
  revalidatePath('/');
}

export async function revokeDevice(id: string) {
  await prisma.device.update({
    where: { id },
    data: { isRevoked: true }
  });
  revalidatePath('/');
}

export async function unrevokeDevice(id: string) {
  await prisma.device.update({
    where: { id },
    data: { isRevoked: false }
  });
  revalidatePath('/');
}
