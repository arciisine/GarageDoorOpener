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
}
