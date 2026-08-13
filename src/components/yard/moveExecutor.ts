// Drives vehicle movement along a waypoint path at constant speed, frame by frame.
// The path itself is never computed here — it's handed in via setRoute (mock today,
// the backend's route-planning response eventually). This class only walks it.

const SPEED_UNITS_PER_SEC = 10;

export interface VehicleTransform {
  x: number;
  z: number;
  rotationY: number;
}

interface ActiveMotion {
  waypoints: [number, number][];
  segmentIndex: number;
  segmentProgress: number;
  transform: VehicleTransform;
}

function headingBetween(a: [number, number], b: [number, number]): number {
  return Math.atan2(b[0] - a[0], b[1] - a[1]);
}

export class MoveExecutor {
  private active = new Map<string, ActiveMotion>();
  private completed = new Map<string, VehicleTransform>();

  // waypoints.length < 2 means "just sit here" — used for vehicles with no active move.
  setRoute(vehicleId: string, waypoints: [number, number][]): void {
    const first = waypoints[0];
    if (!first || waypoints.length < 2) {
      this.active.delete(vehicleId);
      if (first) {
        const rotationY = this.completed.get(vehicleId)?.rotationY ?? this.active.get(vehicleId)?.transform.rotationY ?? 0;
        this.completed.set(vehicleId, { x: first[0], z: first[1], rotationY });
      }
      return;
    }

    this.completed.delete(vehicleId);
    this.active.set(vehicleId, {
      waypoints,
      segmentIndex: 0,
      segmentProgress: 0,
      transform: { x: first[0], z: first[1], rotationY: 0 },
    });
  }

  tick(deltaSeconds: number): void {
    for (const [vehicleId, motion] of [...this.active]) {
      const { waypoints } = motion;
      const start = waypoints[motion.segmentIndex]!;
      const end = waypoints[motion.segmentIndex + 1]!;
      const segmentLength = Math.max(0.0001, Math.hypot(end[0] - start[0], end[1] - start[1]));

      motion.segmentProgress += (SPEED_UNITS_PER_SEC * deltaSeconds) / segmentLength;

      if (motion.segmentProgress >= 1) {
        motion.segmentIndex += 1;
        motion.segmentProgress = 0;

        if (motion.segmentIndex >= waypoints.length - 1) {
          const final = waypoints[waypoints.length - 1]!;
          this.completed.set(vehicleId, { x: final[0], z: final[1], rotationY: motion.transform.rotationY });
          this.active.delete(vehicleId);
          continue;
        }
      }

      const segStart = waypoints[motion.segmentIndex]!;
      const segEnd = waypoints[motion.segmentIndex + 1]!;
      const t = Math.min(1, motion.segmentProgress);
      motion.transform = {
        x: segStart[0] + (segEnd[0] - segStart[0]) * t,
        z: segStart[1] + (segEnd[1] - segStart[1]) * t,
        rotationY: headingBetween(segStart, segEnd),
      };
    }
  }

  getTransform(vehicleId: string): VehicleTransform | undefined {
    return this.active.get(vehicleId)?.transform ?? this.completed.get(vehicleId);
  }
}
