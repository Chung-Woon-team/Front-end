// Drives vehicle movement along a waypoint path, frame by frame — but paced by each
// waypoint's `t` (a timeline in ticks shared across all vehicles in the batch), not by
// constant speed from a common start. The backend stamps every waypoint with the tick
// it should be reached at, and different vehicles' paths start at different first-`t`
// values (e.g. a shared gate cell entered one tick apart) — that's what makes vehicles
// depart in sequence instead of all lurching forward the instant a plan loads.
// The path itself is never computed here — it's handed in via setRoute (mock today,
// the backend's route-planning response eventually). This class only walks it.

// How many real seconds one tick of backend time takes to play out on screen.
const SECONDS_PER_TICK = 0.08;

// 백엔드 경로가 다른 차량의 칸을 그대로 지나가도록 계산돼 있는 경우가 있다 — 이미
// 주차된 차량뿐 아니라 같은 배치에서 동시에 움직이는 다른 차량과도 마찬가지다
// (백엔드 라우팅 이슈, 우리가 우회 경로를 만들어내지는 않는다). 대신 서로 가까워지는
// 구간만 살짝 띄우고 반투명하게 만들어서 "뚫고 지나감"이 아니라 "위로 지나감"처럼
// 보이게 하는 순수 시각적 완화다 — 실제 좌표/타이밍은 백엔드가 준 값 그대로 유지한다.
const AVOID_RADIUS = 0.6;
const HOP_HEIGHT = 0.55;
const MIN_OPACITY = 0.55;
const BASE_VISUAL: VehicleVisual = { y: 0.2, opacity: 1 };

export interface VehicleTransform {
  x: number;
  z: number;
  rotationY: number;
}

export interface VehicleVisual {
  y: number;
  opacity: number;
}

interface TimedPoint {
  x: number;
  z: number;
  t: number;
}

interface ActiveMotion {
  waypoints: TimedPoint[];
  transform: VehicleTransform;
}

function headingBetween(a: TimedPoint, b: TimedPoint): number {
  return Math.atan2(b.x - a.x, b.z - a.z);
}

export class MoveExecutor {
  private active = new Map<string, ActiveMotion>();
  private completed = new Map<string, VehicleTransform>();
  private visuals = new Map<string, VehicleVisual>();
  private staticPoints: { x: number; z: number }[] = [];
  // Shared clock all vehicles in the current batch are paced against, in ticks —
  // this is what lets a later first-`t` mean "departs later", not just "starts later
  // than when its own setRoute happened to be called".
  private simTicks = 0;

  // Call once per new batch of moves (e.g. each relocation run) so every vehicle's
  // `t` values are measured from the same t=0, matching what the backend intended.
  resetClock(): void {
    this.simTicks = 0;
  }

  // Positions of vehicles that aren't moving in this batch (already parked) — used
  // alongside other moving vehicles' live positions for the hop/fade proximity check.
  setStaticPoints(points: { x: number; z: number }[]): void {
    this.staticPoints = points;
  }

  // waypoints.length < 2 means "just sit here" — used for vehicles with no active move.
  setRoute(vehicleId: string, waypoints: TimedPoint[]): void {
    const first = waypoints[0];
    if (!first || waypoints.length < 2) {
      this.active.delete(vehicleId);
      this.visuals.delete(vehicleId);
      if (first) {
        const rotationY = this.completed.get(vehicleId)?.rotationY ?? this.active.get(vehicleId)?.transform.rotationY ?? 0;
        this.completed.set(vehicleId, { x: first.x, z: first.z, rotationY });
      }
      return;
    }

    this.completed.delete(vehicleId);
    this.active.set(vehicleId, {
      waypoints,
      transform: { x: first.x, z: first.z, rotationY: 0 },
    });
  }

  tick(deltaSeconds: number): void {
    this.simTicks += deltaSeconds / SECONDS_PER_TICK;

    for (const [vehicleId, motion] of [...this.active]) {
      const { waypoints } = motion;
      const firstT = waypoints[0]!.t;
      const lastT = waypoints[waypoints.length - 1]!.t;
      // Before its first waypoint's t, a vehicle just holds at its start point — that's
      // the "hasn't departed yet" state that staggers different vehicles' departures.
      const clampedTicks = Math.min(Math.max(this.simTicks, firstT), lastT);

      let segIndex = 0;
      while (segIndex < waypoints.length - 2 && waypoints[segIndex + 1]!.t <= clampedTicks) {
        segIndex += 1;
      }

      const segStart = waypoints[segIndex]!;
      const segEnd = waypoints[segIndex + 1]!;
      const span = Math.max(0.0001, segEnd.t - segStart.t);
      const localT = Math.min(1, Math.max(0, (clampedTicks - segStart.t) / span));

      motion.transform = {
        x: segStart.x + (segEnd.x - segStart.x) * localT,
        z: segStart.z + (segEnd.z - segStart.z) * localT,
        rotationY: headingBetween(segStart, segEnd),
      };

      if (this.simTicks >= lastT) {
        this.completed.set(vehicleId, motion.transform);
        this.active.delete(vehicleId);
        this.visuals.delete(vehicleId);
      }
    }

    this.updateVisuals();
  }

  // 이동 중인 차량들끼리, 그리고 이동 중인 차량과 정지 중인 차량 사이의 근접도를 한
  // 번에 계산한다 — tick()에서 모든 활성 차량의 이번 프레임 위치를 먼저 다 갱신한
  // 뒤에 계산해야 서로의 "이번 프레임" 위치를 정확히 비교할 수 있다.
  private updateVisuals(): void {
    const activeEntries = [...this.active.entries()];

    for (const [vehicleId, motion] of activeEntries) {
      const { x, z } = motion.transform;
      let nearest = Infinity;

      for (const point of this.staticPoints) {
        const dist = Math.hypot(point.x - x, point.z - z);
        if (dist < nearest) nearest = dist;
      }

      for (const [otherId, otherMotion] of activeEntries) {
        if (otherId === vehicleId) continue;
        const dist = Math.hypot(otherMotion.transform.x - x, otherMotion.transform.z - z);
        if (dist < nearest) nearest = dist;
      }

      if (nearest < AVOID_RADIUS) {
        const closeness = 1 - nearest / AVOID_RADIUS;
        this.visuals.set(vehicleId, {
          y: BASE_VISUAL.y + closeness * HOP_HEIGHT,
          opacity: 1 - closeness * (1 - MIN_OPACITY),
        });
      } else {
        this.visuals.set(vehicleId, BASE_VISUAL);
      }
    }
  }

  getTransform(vehicleId: string): VehicleTransform | undefined {
    return this.active.get(vehicleId)?.transform ?? this.completed.get(vehicleId);
  }

  getVisual(vehicleId: string): VehicleVisual {
    return this.visuals.get(vehicleId) ?? BASE_VISUAL;
  }
}
