// 백엔드가 차량 종류를 내려주지 않는다 — vehicle_id로부터 결정적으로(같은 차는 항상
// 같은 종류로) 파생시킨 프론트 전용 표시값이다. 실제 데이터가 아니므로 API 응답
// 타입(YardCell 등)에는 섞지 않고, 보여줄 때 그때그때 계산해서 쓴다.
const VEHICLE_TYPES = ['SUV', 'EV', 'SEDAN'] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  SUV: 'SUV',
  EV: 'EV',
  SEDAN: '세단',
};

export function getVehicleType(vehicleId: string): VehicleType {
  let hash = 0;
  for (let i = 0; i < vehicleId.length; i += 1) {
    hash = (hash * 31 + vehicleId.charCodeAt(i)) >>> 0;
  }
  return VEHICLE_TYPES[hash % VEHICLE_TYPES.length];
}
