import assert from 'node:assert';

import { RuntimeResources } from '@travetto/runtime';
import { Suite, Test } from '@travetto/test';

import { DoorService } from '../src/door-service';

@Suite()
export class DoorServiceTest {
  @Test()
  async verifyClosedDoorDetection(): Promise<void> {
    const service = new DoorService();
    const sampleImagePath = await RuntimeResources.resolve('closed-door-sample.jpg');

    const detectionResult = await service.inspectImage(sampleImagePath);

    assert.strictEqual(detectionResult.isClosed, true);
    assert.ok(detectionResult.saturationPercentage < 25, 'Saturation should be low for IR mode');
    assert.ok(detectionResult.meanLuminance > 35, 'Mean luminance should indicate IR reflectance');
    assert.ok(detectionResult.standardDeviation < 25, 'Standard deviation should indicate a uniform panel');
  }

  @Test()
  async verifyOpenDoorAtSunsetDetection(): Promise<void> {
    const service = new DoorService();
    const sampleImagePath = await RuntimeResources.resolve('open-door-sunset-sample.png');

    const detectionResult = await service.inspectImage(sampleImagePath);

    assert.strictEqual(detectionResult.isClosed, false);
    assert.ok(detectionResult.standardDeviation > 25, 'Standard deviation should be high due to outdoor scene texture');
  }

  @Test()
  async verifyLateNightAlertGating(): Promise<void> {
    const service = new DoorService();

    const openResult = {
      isClosed: false,
      reason: 'Open door detected',
      saturationPercentage: 10,
      meanLuminance: 120,
      standardDeviation: 60
    };

    const closedResult = {
      isClosed: true,
      reason: 'Closed door detected',
      saturationPercentage: 10,
      meanLuminance: 120,
      standardDeviation: 15
    };

    // 8:00 PM EDT (20:00) -> Should not alert
    const eightPostMeridiemDate = new Date();
    eightPostMeridiemDate.setHours(20, 0, 0, 0);
    const eightPostMeridiemTimestamp = eightPostMeridiemDate.getTime();

    const triggeredAtEight = await service.evaluateAlert(openResult, eightPostMeridiemTimestamp);
    assert.strictEqual(triggeredAtEight, false, 'Should not alert before 9:00 PM');

    // 9:05 PM EDT (21:05) -> First open alert after 9:00 PM
    const nineZeroFiveDate = new Date();
    nineZeroFiveDate.setHours(21, 5, 0, 0);
    const nineZeroFiveTimestamp = nineZeroFiveDate.getTime();

    const triggeredAtNineZeroFive = await service.evaluateAlert(openResult, nineZeroFiveTimestamp);
    assert.strictEqual(triggeredAtNineZeroFive, true, 'Should trigger alert at 9:05 PM');

    // 9:15 PM EDT (21:15) -> 10 minutes later, throttled by 30-minute cooldown
    const nineFifteenDate = new Date();
    nineFifteenDate.setHours(21, 15, 0, 0);
    const nineFifteenTimestamp = nineFifteenDate.getTime();

    const triggeredAtNineFifteen = await service.evaluateAlert(openResult, nineFifteenTimestamp);
    assert.strictEqual(triggeredAtNineFifteen, false, 'Should be throttled by 30-minute cooldown');

    // 9:36 PM EDT (21:36) -> 31 minutes later, should alert again
    const nineThirtySixDate = new Date();
    nineThirtySixDate.setHours(21, 36, 0, 0);
    const nineThirtySixTimestamp = nineThirtySixDate.getTime();

    const triggeredAtNineThirtySix = await service.evaluateAlert(openResult, nineThirtySixTimestamp);
    assert.strictEqual(triggeredAtNineThirtySix, true, 'Should trigger alert after 30-minute cooldown');

    // 9:40 PM EDT (21:40) -> Closed door resets alert tracking
    const nineFortyDate = new Date();
    nineFortyDate.setHours(21, 40, 0, 0);
    const nineFortyTimestamp = nineFortyDate.getTime();

    const triggeredAtClosed = await service.evaluateAlert(closedResult, nineFortyTimestamp);
    assert.strictEqual(triggeredAtClosed, false, 'Should not alert when door is closed');
    assert.strictEqual(service.lastAlertTimestamp, 0, 'Last alert timestamp should reset on door close');

    // 9:45 PM EDT (21:45) -> Re-opened door alerts immediately
    const nineFortyFiveDate = new Date();
    nineFortyFiveDate.setHours(21, 45, 0, 0);
    const nineFortyFiveTimestamp = nineFortyFiveDate.getTime();

    const triggeredAtNineFortyFive = await service.evaluateAlert(openResult, nineFortyFiveTimestamp);
    assert.strictEqual(triggeredAtNineFortyFive, true, 'Should alert immediately if re-opened');
  }
}
