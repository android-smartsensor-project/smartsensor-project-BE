type Gender = 'M' | 'W';

interface PointsPolicy {
    '20': {
        [key in Gender]: [number, number];
    };
    '30': {
        [key in Gender]: [number, number];
    };
    '40': {
        [key in Gender]: [number, number];
    };
    '50': {
        [key in Gender]: [number, number];
    };
    '60': {
        [key in Gender]: [number, number];
    };
    '70': {
        [key in Gender]: [number, number];
    };
}