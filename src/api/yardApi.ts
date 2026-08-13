import { apiFetch, ENDPOINTS } from './client';
import type { VehiclePayload, YardOccupancyResponse, YardState } from '../types/yardApi';

// Real backend reads. Not yet wired into YardPage — that screen still runs on the
// self-contained mock generator in api/yard.ts for its 3D relocation demo.

export async function fetchYardState(): Promise<YardState> {
  return apiFetch<YardState>(ENDPOINTS.yardState());
}

export async function fetchYardOccupancy(): Promise<YardOccupancyResponse> {
  return apiFetch<YardOccupancyResponse>(ENDPOINTS.yardOccupancy());
}

export async function fetchVehicles(): Promise<VehiclePayload[]> {
  return apiFetch<VehiclePayload[]>(ENDPOINTS.vehicles());
}
