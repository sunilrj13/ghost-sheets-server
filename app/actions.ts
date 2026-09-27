'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function generateKey(formData: FormData) {
  const customerName = formData.get('customerName') as string;
  const maxDevices = parseInt(formData.get('maxDevices') as string) || 1;
  const expiresAtStr = formData.get('expiresAt') as string;
  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

  // Generate unique key format: GHOST-XXXX-XXXX-XXXX
  const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  const key = `GHOST-${randomPart()}-${randomPart()}-${randomPart()}`;

  const id = uuidv4();
  
  await pool.query(
    'INSERT INTO License (id, `key`, status, maxDevices, expiresAt, customerName) VALUES (?, ?, ?, ?, ?, ?)',
    [id, key, 'ACTIVE', maxDevices, expiresAt, customerName || 'Unknown']
  );

  revalidatePath('/');
}

export async function revokeLicense(id: string) {
  await pool.query('UPDATE License SET status = ? WHERE id = ?', ['REVOKED', id]);
  revalidatePath('/');
}

export async function activateLicenseAgain(id: string) {
  await pool.query('UPDATE License SET status = ? WHERE id = ?', ['ACTIVE', id]);
  revalidatePath('/');
}

export async function deleteLicense(id: string) {
  await pool.query('DELETE FROM License WHERE id = ?', [id]);
  revalidatePath('/');
}

export async function revokeDevice(id: string) {
  await pool.query('UPDATE Device SET isRevoked = ? WHERE id = ?', [true, id]);
  revalidatePath('/');
}

export async function unrevokeDevice(id: string) {
  await pool.query('UPDATE Device SET isRevoked = ? WHERE id = ?', [false, id]);
  revalidatePath('/');
}
