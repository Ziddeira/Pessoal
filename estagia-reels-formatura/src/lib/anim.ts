import {Easing, interpolate} from 'remotion';

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

export const clamp = {
	extrapolateLeft: 'clamp',
	extrapolateRight: 'clamp',
} as const;

// 0 → 1 entre os quadros a e b.
export const prog = (frame: number, a: number, b: number, easing = easeOut) =>
	interpolate(frame, [a, b], [0, 1], {...clamp, easing});
