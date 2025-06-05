import {createHash} from 'crypto';

export function createSHA256Hash(inputString: string) {
    const hash = createHash('sha256');
    hash.update(inputString);
    return hash.digest('hex');
}
