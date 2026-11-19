import assert from 'node:assert';

import sharp from 'sharp';

import { Suite, Test, TestFixtures } from '@travetto/test';

import { DoorService } from '../src/door-service';

@Suite()
export class DoorServiceTest {
  fixtures = new TestFixtures();

  @Test()
  async verifyClosedDoorDetection(): Promise<void> {
    const service = new DoorService();
    const sampleImagePath = await this.fixtures.resolve('closed-door-sample.jpg');

    const detectionResult = await service.inspectImage(sampleImagePath);

    assert.strictEqual(detectionResult.isClosed, true);
    assert.ok(detectionResult.saturationPercentage < 25, 'Saturation should be low for IR mode');
    assert.ok(detectionResult.meanLuminance > 35, 'Mean luminance should indicate IR reflectance');
    assert.ok(detectionResult.standardDeviation < 25, 'Standard deviation should indicate a uniform panel');
  }

  @Test()
  async verifyOpenDoorAtSunsetDetection(): Promise<void> {
    const service = new DoorService();
    const sampleImagePath = await this.fixtures.resolve('open-door-sunset-sample.png');

    const detectionResult = await service.inspectImage(sampleImagePath);

    assert.strictEqual(detectionResult.isClosed, false);
    assert.ok(detectionResult.standardDeviation > 25, 'Standard deviation should be high due to outdoor scene texture');
  }

  @Test()
  async verifyOpenDoorAtNightDetection(): Promise<void> {
    const service = new DoorService();
    const sampleImagePath = await this.fixtures.resolve('open-door-night-sample.jpg');

    const detectionResult = await service.inspectImage(sampleImagePath);

    assert.strictEqual(detectionResult.isClosed, false);
    assert.strictEqual(detectionResult.reason, 'Nighttime open void detected (low luminance)');
    assert.ok(detectionResult.meanLuminance < 35, 'Mean luminance should be low for nighttime open door void');
  }

  @Test()
  async verifyClosedDoorInDarkDetection(): Promise<void> {
    const service = new DoorService();
    const darkImageBuffer = await sharp({
      create: {
        width: 1280,
        height: 720,
        channels: 3,
        background: { r: 2, g: 2, b: 2 }
      }
    })
      .png()
      .toBuffer();

    const detectionResult = await service.inspectImage(darkImageBuffer);

    assert.strictEqual(detectionResult.isClosed, true);
    assert.strictEqual(detectionResult.reason, 'Dark closed garage detected (near-black, low noise)');
    assert.ok(detectionResult.meanLuminance < 5, 'Mean luminance should be near black');
    assert.strictEqual(detectionResult.standardDeviation, 0, 'Standard deviation should be 0 for uniform dark image');
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

    // 12:05 AM EDT (00:05) -> Should not alert after midnight
    const twelveZeroFiveAnteMeridiemDate = new Date();
    twelveZeroFiveAnteMeridiemDate.setHours(0, 5, 0, 0);
    const twelveZeroFiveAnteMeridiemTimestamp = twelveZeroFiveAnteMeridiemDate.getTime();

    const triggeredAtMidnight = await service.evaluateAlert(openResult, twelveZeroFiveAnteMeridiemTimestamp);
    assert.strictEqual(triggeredAtMidnight, false, 'Should not alert at or after 12:00 AM');

    // 2:00 AM EDT (02:00) -> Should not alert in early morning
    const twoAnteMeridiemDate = new Date();
    twoAnteMeridiemDate.setHours(2, 0, 0, 0);
    const twoAnteMeridiemTimestamp = twoAnteMeridiemDate.getTime();

    const triggeredAtTwo = await service.evaluateAlert(openResult, twoAnteMeridiemTimestamp);
    assert.strictEqual(triggeredAtTwo, false, 'Should not alert after 12:00 AM');

    // 9:05 PM EDT (21:05) -> First open alert after 9:00 PM
    const nineZeroFiveDate = new Date();
    nineZeroFiveDate.setHours(21, 5, 0, 0);
    const nineZeroFiveTimestamp = nineZeroFiveDate.getTime();

    const triggeredAtNineZeroFive = await service.evaluateAlert(openResult, nineZeroFiveTimestamp);
    assert.strictEqual(triggeredAtNineZeroFive, true, 'Should trigger alert at 9:05 PM');

    // 9:36 PM EDT (21:36) -> 31 minutes later, throttled by 1-hour cooldown
    const nineThirtySixDate = new Date();
    nineThirtySixDate.setHours(21, 36, 0, 0);
    const nineThirtySixTimestamp = nineThirtySixDate.getTime();

    const triggeredAtNineThirtySix = await service.evaluateAlert(openResult, nineThirtySixTimestamp);
    assert.strictEqual(triggeredAtNineThirtySix, false, 'Should be throttled by 1-hour cooldown');

    // 10:06 PM EDT (22:06) -> 61 minutes later, should alert again
    const tenZeroSixDate = new Date();
    tenZeroSixDate.setHours(22, 6, 0, 0);
    const tenZeroSixTimestamp = tenZeroSixDate.getTime();

    const triggeredAtTenZeroSix = await service.evaluateAlert(openResult, tenZeroSixTimestamp);
    assert.strictEqual(triggeredAtTenZeroSix, true, 'Should trigger alert after 1-hour cooldown');

    // 10:10 PM EDT (22:10) -> Closed door resets alert tracking
    const tenTenDate = new Date();
    tenTenDate.setHours(22, 10, 0, 0);
    const tenTenTimestamp = tenTenDate.getTime();

    const triggeredAtClosed = await service.evaluateAlert(closedResult, tenTenTimestamp);
    assert.strictEqual(triggeredAtClosed, false, 'Should not alert when door is closed');
    assert.strictEqual(service.lastAlertTimestamp, 0, 'Last alert timestamp should reset on door close');

    // 10:15 PM EDT (22:15) -> Re-opened door alerts immediately
    const tenFifteenDate = new Date();
    tenFifteenDate.setHours(22, 15, 0, 0);
    const tenFifteenTimestamp = tenFifteenDate.getTime();

    const triggeredAtTenFifteen = await service.evaluateAlert(openResult, tenFifteenTimestamp);
    assert.strictEqual(triggeredAtTenFifteen, true, 'Should alert immediately if re-opened');
  }

  @Test()
  async verifyLateNightAlertWithImageUrl(): Promise<void> {
    const service = new DoorService();
    const openResult = {
      isClosed: false,
      reason: 'Open door detected',
      saturationPercentage: 10,
      meanLuminance: 120,
      standardDeviation: 60
    };

    const ninePostMeridiemDate = new Date();
    ninePostMeridiemDate.setHours(21, 10, 0, 0);
    const timestamp = ninePostMeridiemDate.getTime();
    const sampleImageUrl = 'https://s3.amazonaws.com/garage/images/sample.jpg';

    let capturedImageUrl: string | undefined;
    service.dispatchLateNightAlert = async (alertTimestamp: number, imageUrl?: string): Promise<void> => {
      capturedImageUrl = imageUrl;
    };

    const triggered = await service.evaluateAlert(openResult, timestamp, sampleImageUrl);
    assert.strictEqual(triggered, true, 'Should trigger alert');
    assert.strictEqual(capturedImageUrl, sampleImageUrl, 'Should pass image URL to dispatchLateNightAlert');
  }
}
