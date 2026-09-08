import * as firebaseDb from 'firebase/database';
import sharp from 'sharp';

import { Inject, Injectable } from '@travetto/di';

export interface RegionOfInterest {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DoorDetectionResult {
  isClosed: boolean;
  reason: string;
  saturationPercentage: number;
  meanLuminance: number;
  standardDeviation: number;
}

@Injectable()
export class DoorService {
  @Inject()
  database: firebaseDb.Database;

  /**
   * Upper-left door panel area (unobstructed by vehicle, 1280x720 baseline)
   * Corresponds to coordinates (300, 368) -> (468, 504)
   */
  readonly defaultRegionOfInterest: RegionOfInterest = {
    left: 300,
    top: 368,
    width: 168,
    height: 136
  };

  /**
   * Evaluates the door state from an image path or buffer.
   */
  async inspectImage(
    imageInput: string | Buffer,
    regionOfInterest: RegionOfInterest = this.defaultRegionOfInterest
  ): Promise<DoorDetectionResult> {
    const croppedBuffer = await sharp(imageInput).extract(regionOfInterest).toBuffer();

    const statistics = await sharp(croppedBuffer).stats();

    const redChannel = statistics.channels[0];
    const greenChannel = statistics.channels[1];
    const blueChannel = statistics.channels[2];

    const meanLuminance = 0.299 * redChannel.mean + 0.587 * greenChannel.mean + 0.114 * blueChannel.mean;

    const maximumChannel = Math.max(redChannel.mean, greenChannel.mean, blueChannel.mean);
    const minimumChannel = Math.min(redChannel.mean, greenChannel.mean, blueChannel.mean);
    const saturationPercentage = maximumChannel > 0 ? ((maximumChannel - minimumChannel) / maximumChannel) * 100 : 0;

    const averageStandardDeviation = (redChannel.stdev + greenChannel.stdev + blueChannel.stdev) / 3;

    // 1. Daytime Open: camera provides vivid color from daylight and outdoor scene
    if (saturationPercentage > 25) {
      return {
        isClosed: false,
        reason: 'Daylight color detected (high saturation)',
        saturationPercentage,
        meanLuminance,
        standardDeviation: averageStandardDeviation
      };
    }

    // 2. Nighttime Open: IR light dissipates outdoors without reflecting back
    if (meanLuminance < 35) {
      return {
        isClosed: false,
        reason: 'Nighttime open void detected (low luminance)',
        saturationPercentage,
        meanLuminance,
        standardDeviation: averageStandardDeviation
      };
    }

    // 3. Closed Door: Grayscale IR illumination bouncing off a flat, uniform panel
    if (averageStandardDeviation <= 25) {
      return {
        isClosed: true,
        reason: 'Uniform grayscale IR panel detected',
        saturationPercentage,
        meanLuminance,
        standardDeviation: averageStandardDeviation
      };
    }

    // Non-uniform grayscale indicates an open doorway at dusk/dawn or textured background
    return {
      isClosed: false,
      reason: 'High texture variation in scene',
      saturationPercentage,
      meanLuminance,
      standardDeviation: averageStandardDeviation
    };
  }

  /**
   * Inspects the image and persists the detection result to Firebase.
   */
  async recordDoorState(imagePath: string): Promise<DoorDetectionResult | undefined> {
    try {
      const detectionResult = await this.inspectImage(imagePath);
      console.log('[Door Detection] Result:', detectionResult);
      const stateReference = firebaseDb.ref(this.database, '/DoorState');
      await firebaseDb.set(stateReference, {
        isClosed: detectionResult.isClosed,
        reason: detectionResult.reason,
        saturationPercentage: detectionResult.saturationPercentage,
        meanLuminance: detectionResult.meanLuminance,
        standardDeviation: detectionResult.standardDeviation,
        timestamp: Date.now()
      });
      return detectionResult;
    } catch (detectionError) {
      console.log('[Door Detection] Failed', detectionError);
      return undefined;
    }
  }
}
