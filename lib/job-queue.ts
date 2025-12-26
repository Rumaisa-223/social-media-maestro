import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;
const disableQueue = String(process.env.DISABLE_QUEUE || '').toLowerCase() === 'true';
const isRedisConfigured = !!redisUrl && !disableQueue;

export const queueConnection: any = isRedisConfigured
  ? new IORedis(redisUrl as string, { maxRetriesPerRequest: null })
  : {
      mget: async (...keys: string[]) => Array(keys.length).fill(null),
      get: async (_key: string) => null,
      set: async (_key: string, _val: string) => "OK",
    };

export const scheduleQueue: any = isRedisConfigured
  ? new Queue("social-schedules", { connection: queueConnection })
  : { add: async () => {} };

export async function enqueueScheduleJob(scheduleId: string, runAt: Date) {
  const delay = Math.max(runAt.getTime() - Date.now(), 0);
  await scheduleQueue.add(
    "publish",
    { scheduleId },
    {
      delay,
      jobId: scheduleId,
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  );
}

