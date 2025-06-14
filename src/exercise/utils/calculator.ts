import { PointsPolicy } from '../types/PointsPolicy';

export function calcKcal(velocity: number, weight: number, movetime: number) {
    const met =
        velocity < 7.0
            ? 1.2 + 0.9 * velocity
            : 0.6 * velocity * velocity - 1.5 * velocity + 8.0;
    return Math.ceil(met * weight * (movetime / 3600) * 100) / 100;
}

export function calcPointsBasedPolicy(
    velocity: number,
    pointsPolicy: PointsPolicy,
    birth: string,
    sex: string,
): number {
    const curDate = new Date();
    const age =
        Math.floor(
            (curDate.getFullYear() - parseInt(birth.substring(0, 4))) / 10,
        ) * 10;
    const [minVelo, maxVelo] =
        pointsPolicy[age >= 70 ? 70 : age <= 20 ? 20 : age][sex];
    const savedPoints =
        velocity >= maxVelo ? 2 : velocity <= minVelo ? 1 : velocity / minVelo;
    return Math.ceil(savedPoints * 100) / 100;
}
