import { apiFetch, ENDPOINTS } from './client';
import type {
  OccupancyCheckResponse,
  OccupancyConfirmRequest,
  OccupancyConfirmResponse,
  OccupancySourceType,
  VehiclePayload,
  YardOccupancyResponse,
  YardState,
} from '../types/yardApi';

// Real backend reads/writes for the yard. fetchYardOccupancy powers YardPage's 3D view
// (see api/yardLive.ts for the adapter into the mock demo's YardView shape).

export async function fetchYardState(): Promise<YardState> {
  return apiFetch<YardState>(ENDPOINTS.yardState());
}

export async function fetchYardOccupancy(): Promise<YardOccupancyResponse> {
  return apiFetch<YardOccupancyResponse>(ENDPOINTS.yardOccupancy());
}

export async function fetchVehicles(): Promise<VehiclePayload[]> {
  return apiFetch<VehiclePayload[]>(ENDPOINTS.vehicles());
}

// 야드 전체 사진 한 장을 슬롯 상태와 대조한다. 아직 DB를 바꾸지 않는다 —
// batch_id를 들고 confirmYardOccupancy를 불러야 실제로 반영된다. 이미지 처리라 10~30초 걸릴 수 있다.
export async function checkYardOccupancy(
  file: File,
  sourceType: OccupancySourceType = 'MANUAL',
): Promise<OccupancyCheckResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<OccupancyCheckResponse>(`${ENDPOINTS.yardOccupancyCheck()}?sourceType=${sourceType}`, {
    method: 'POST',
    body: formData,
  });
}

export async function confirmYardOccupancy(
  batchId: string,
  payload: OccupancyConfirmRequest,
): Promise<OccupancyConfirmResponse> {
  return apiFetch<OccupancyConfirmResponse>(ENDPOINTS.yardOccupancyConfirm(batchId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
