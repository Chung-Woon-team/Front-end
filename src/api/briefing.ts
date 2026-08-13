import { apiFetch, ENDPOINTS } from './client';
import type { BriefingResponse } from '../types/briefing';

/** 저장된 브리핑을 읽는다. 파이썬이 죽어 있어도 200 이고, 생성 전이면 state='NOT_GENERATED'. */
export async function fetchPlanBriefing(planVersion: string): Promise<BriefingResponse> {
  return apiFetch<BriefingResponse>(ENDPOINTS.planBriefing(planVersion));
}

/**
 * 브리핑을 생성(재생성)해서 저장하고, fetchPlanBriefing 과 똑같은 형태를 돌려준다.
 * 호출할 때마다 덮어쓴다(멱등하지 않음). 요청 바디는 없다.
 * 파이썬을 타므로 AI 가 죽어 있으면 503 AI001 이 온다 — 조회와 달리 이 요청만 실패한다.
 */
export async function generatePlanBriefing(planVersion: string): Promise<BriefingResponse> {
  return apiFetch<BriefingResponse>(ENDPOINTS.planBriefing(planVersion), { method: 'POST' });
}
