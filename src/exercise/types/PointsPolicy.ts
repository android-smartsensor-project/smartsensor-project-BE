type Gender = 'M' | 'W';
type AgeGroup = '20' | '30' | '40' | '50' | '60' | '70';

export type PointsPolicy = Record<AgeGroup, Record<Gender, number[]>>;