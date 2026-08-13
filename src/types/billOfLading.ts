// Matches the live backend's Result schema (snake_case, curl-verified pattern
// consistent with the rest of the API as of 2026-08-13 — not yet curl-confirmed
// with a successful extraction, only inferred from the shared naming convention).
export interface BillOfLadingResult {
  bl_number: string;
  vehicle_count: number;
  vehicle_ids: string[];
}
