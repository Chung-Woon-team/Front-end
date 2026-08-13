import { apiFetch, ENDPOINTS } from './client';
import type { BillOfLadingResult } from '../types/billOfLading';

export async function extractBillOfLading(file: File): Promise<BillOfLadingResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<BillOfLadingResult>(ENDPOINTS.billOfLadingExtract(), {
    method: 'POST',
    body: formData,
  });
}
