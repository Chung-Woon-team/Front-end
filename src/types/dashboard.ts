// Matches the live backend's DashboardResponse (snake_case, curl-verified 2026-08-13).
export interface DashboardSummary {
  vehicles_in_yard: number;
  vehicles_arrived_today: number;
  pending_constraints: number;
  available_slots: number;
  total_slots: number;
  occupancy_pct: number;
  congestion: string;
  congestion_label: string;
  // Omitted by the server (not just 0) when there's nothing to average yet — e.g. an
  // empty yard. Guard before calling .toFixed() etc. (observed live, 2026-08-13).
  avg_move_distance_meters?: number;
  avg_move_distance_delta_pct?: number;
}

export interface DashboardBlockStatus {
  block_id: string;
  zone_code: string;
  status: string;
  status_label: string;
  occupied: number;
  capacity: number;
  note: string;
}

export interface DashboardActivity {
  type: string;
  title: string;
  description: string;
  occurred_at: string;
}

export interface DashboardRecentInstruction {
  instruction_id: string;
  author: string;
  summary: string;
  status: string;
  status_label: string;
  created_at: string;
}

export interface DashboardAiEngine {
  status: string;
  status_label: string;
  gemini_enabled: boolean;
}

export interface DashboardResponse {
  generated_at: string;
  summary: DashboardSummary;
  blocks: DashboardBlockStatus[];
  recent_activities: DashboardActivity[];
  recent_instructions: DashboardRecentInstruction[];
  ai_engine: DashboardAiEngine;
}
