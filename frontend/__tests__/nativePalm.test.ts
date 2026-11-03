jest.mock('react-native', () => ({ NativeModules: { TaroVision: { preload: jest.fn(async () => true), detect: jest.fn(), infer: jest.fn() } } }));
import { NativeModules } from 'react-native';
import { detectPalm, preloadPalmDetector, isPalmDetectionSupported } from '../src/utils/palmDetector.android';
const bridge = NativeModules.TaroVision;
beforeEach(() => { jest.clearAllMocks(); });
test('prepares the bundled models before taking a photograph', () => {
  expect(isPalmDetectionSupported()).toBe(true);
  preloadPalmDetector();
  expect(bridge.preload).toHaveBeenCalledTimes(1);
});
test('an image without a hand does not receive an invented reading', async () => {
  bridge.detect.mockResolvedValue({ width: 100, height: 200, landmarks: [] });
  expect(await detectPalm('file:///photo.jpg')).toEqual({ ok: false, error: 'no_hand' });
  expect(bridge.infer).not.toHaveBeenCalled();
});
test('a damaged photo produces a recoverable failure', async () => {
  bridge.detect.mockRejectedValue(new Error('decode failed'));
  expect(await detectPalm('file:///photo.jpg')).toEqual({ ok: false, error: 'image_failed' });
});
test('an incomplete native payload returns an error instead of leaving the camera waiting', async () => {
  bridge.detect.mockResolvedValue({ width: 100, height: 200, landmarks: Array.from({ length: 21 }, () => ({ x: .5, y: .5 })) });
  expect(await detectPalm('file:///photo.jpg')).toEqual({ ok: false, error: 'image_failed' });
  expect(bridge.infer).not.toHaveBeenCalled();
});
test('rejects the back of a hand before attempting line inference', async () => {
  const points = Array.from({ length: 21 }, () => ({ x: .5, y: .9 }));
  points[5] = { x: .3, y: .4 }; points[17] = { x: .8, y: .5 };
  bridge.detect.mockResolvedValue({ width: 100, height: 200, landmarks: points, hand: 'Right', confidence: .99 });
  expect(await detectPalm('file:///photo.jpg')).toEqual({ ok: false, error: 'back_of_hand' });
  expect(bridge.infer).not.toHaveBeenCalled();
});
