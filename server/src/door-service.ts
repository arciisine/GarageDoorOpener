import { cert, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import * as firebaseDb from 'firebase/database';
import sharp from 'sharp';

import { Inject, Injectable, PostConstruct } from '@travetto/di';
import { JSONUtil, RuntimeResources, TimeUtil } from '@travetto/runtime';

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
  static readonly DARK_CLOSED_LUMINANCE_THRESHOLD = 5;
  static readonly DARK_CLOSED_STANDARD_DEVIATION_THRESHOLD = 5;

  @Inject()
  database: firebaseDb.Database;

  app: App;
  messaging: Messaging;

  lastAlertTimestamp = 0;

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

  @PostConstruct()
  async postConstruct(): Promise<void> {
    try {
      const alertReference = firebaseDb.ref(this.database, '/DoorAlert/lastAlertTimestamp');
      const databaseSnapshot = await firebaseDb.get(alertReference);
      if (databaseSnapshot.exists()) {
        this.lastAlertTimestamp = databaseSnapshot.val();
      }
    } catch {
      // Fall back to in-memory tracking if offline or uninitialized
    }

    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.app = initializeApp();
      } else {
        const serviceAccountPath = await RuntimeResources.resolve('service-account.json').catch(() => undefined);
        if (serviceAccountPath) {
          const serviceAccount: Parameters<typeof cert>[0] = JSONUtil.fromUTF8(await RuntimeResources.readUTF8('service-account.json'));
          this.app = initializeApp({
            credential: cert(serviceAccount)
          });
        }
      }
      this.messaging = getMessaging(this.app);
    } catch (initializationError) {
      console.log('[Door Alert] Firebase Admin initialization skipped:', initializationError);
    }
  }

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

    // 1. Dark Closed Garage: near-perfect black with minimal noise indicates the light is off and door is shut
    if (
      meanLuminance <= DoorService.DARK_CLOSED_LUMINANCE_THRESHOLD &&
      averageStandardDeviation <= DoorService.DARK_CLOSED_STANDARD_DEVIATION_THRESHOLD
    ) {
      return {
        isClosed: true,
        reason: 'Dark closed garage detected (near-black, low noise)',
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

    // 2. Daytime Open: camera provides vivid color from daylight and outdoor scene
    if (saturationPercentage > 25) {
      return {
        isClosed: false,
        reason: 'Daylight color detected (high saturation)',
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
   * Dispatches the late-night open alert to Firebase Realtime Database and FCM.
   */
  async dispatchLateNightAlert(timestamp: number, imageUrl?: string): Promise<void> {
    const alertTitle = 'Garage Door Alert';
    const alertBody = 'The garage door is still open after 9:00 PM EDT.';

    // 1. Record alert to Firebase Realtime Database
    try {
      if (this.database) {
        const alertReference = firebaseDb.ref(this.database, '/DoorAlert');
        await firebaseDb.set(alertReference, {
          title: alertTitle,
          body: alertBody,
          timestamp,
          isClosed: false,
          lastAlertTimestamp: this.lastAlertTimestamp,
          ...(imageUrl ? { imageUrl } : {})
        });
        console.log('[Door Alert] Alert recorded to Firebase Realtime Database under /DoorAlert');
      }
    } catch (databaseError) {
      console.log('[Door Alert] Failed to write alert to Firebase Database', databaseError);
    }

    // 2. Dispatch FCM Push Notification to topic 'garage_door_alerts'
    try {
      await this.messaging.send({
        topic: 'garage_door_alerts',
        notification: {
          title: alertTitle,
          body: alertBody,
          ...(imageUrl ? { imageUrl } : {})
        },
        data: {
          title: alertTitle,
          body: alertBody,
          doorState: 'open',
          timestamp: timestamp.toString(),
          ...(imageUrl ? { imageUrl } : {})
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'garage_door_alerts',
            priority: 'high',
            ...(imageUrl ? { imageUrl } : {})
          }
        },
        apns: {
          fcmOptions: {
            ...(imageUrl ? { imageUrl } : {})
          }
        }
      });
      console.log('[Door Alert] FCM push notification sent to topic: garage_door_alerts');
    } catch (messagingError) {
      console.log('[Door Alert] Failed to dispatch FCM push notification', messagingError);
    }
  }

  /**
   * Evaluates whether a late-night alert should be triggered.
   * Alerts if the door is open between 9:00 PM and 12:00 AM, throttled to once per hour.
   */
  async evaluateAlert(detectionResult: DoorDetectionResult, timestamp: number = Date.now(), imageUrl?: string): Promise<boolean> {
    if (detectionResult.isClosed) {
      // Reset alert tracking when door is closed
      if (this.lastAlertTimestamp !== 0) {
        this.lastAlertTimestamp = 0;
        if (this.database) {
          const alertReference = firebaseDb.ref(this.database, '/DoorAlert/lastAlertTimestamp');
          await firebaseDb.set(alertReference, 0).catch(() => {});
        }
      }
      return false;
    }

    const currentHour = new Date(timestamp).getHours();
    const isWithinAlertWindow = currentHour >= 21;

    if (!isWithinAlertWindow) {
      return false;
    }

    const hasExceededCooldown = this.lastAlertTimestamp === 0 || timestamp - this.lastAlertTimestamp >= TimeUtil.duration('1h', 'ms');

    if (hasExceededCooldown) {
      this.lastAlertTimestamp = timestamp;
      await this.dispatchLateNightAlert(timestamp, imageUrl);
      return true;
    }

    return false;
  }

  /**
   * Inspects the image, persists the detection result, and evaluates late-night alert gating.
   */
  async recordDoorState(imagePath: string, imageUrl?: string): Promise<DoorDetectionResult | undefined> {
    try {
      const detectionResult = await this.inspectImage(imagePath);
      console.log('[Door Detection] Result:', detectionResult);
      const timestamp = Date.now();
      const stateReference = firebaseDb.ref(this.database, '/DoorState');
      await firebaseDb.set(stateReference, {
        isClosed: detectionResult.isClosed,
        reason: detectionResult.reason,
        saturationPercentage: detectionResult.saturationPercentage,
        meanLuminance: detectionResult.meanLuminance,
        standardDeviation: detectionResult.standardDeviation,
        timestamp,
        imagePath,
        ...(imageUrl ? { imageUrl } : {})
      });

      await this.evaluateAlert(detectionResult, timestamp, imageUrl);

      return detectionResult;
    } catch (detectionError) {
      console.log('[Door Detection] Failed', detectionError);
      return undefined;
    }
  }
}
