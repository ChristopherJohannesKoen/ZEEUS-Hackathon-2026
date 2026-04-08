import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis, { type Redis } from 'ioredis';

const evaluationJobsQueueName = 'zeeus-evaluation-jobs';

type EvaluationJobName = 'artifact.process' | 'narrative.process';

@Injectable()
export class EvaluationJobsService implements OnModuleDestroy {
  private readonly connection: Redis | null;
  private readonly queue: Queue | null;

  constructor() {
    const redisUrl = process.env.REDIS_URL?.trim();

    if (!redisUrl) {
      this.connection = null;
      this.queue = null;
      return;
    }

    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null
    });
    this.queue = new Queue(evaluationJobsQueueName, {
      connection: this.connection
    });
  }

  isEnabled() {
    return Boolean(this.queue);
  }

  async enqueueArtifact(artifactId: string) {
    await this.enqueue('artifact.process', artifactId, `artifact:${artifactId}`);
  }

  async enqueueNarrative(narrativeId: string) {
    await this.enqueue('narrative.process', narrativeId, `narrative:${narrativeId}`);
  }

  async onModuleDestroy() {
    await this.queue?.close();
    await this.connection?.quit();
  }

  private async enqueue(name: EvaluationJobName, entityId: string, jobId: string) {
    if (!this.queue) {
      return false;
    }

    await this.queue.add(
      name,
      {
        entityId
      },
      {
        jobId,
        attempts: 4,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 200,
        removeOnFail: 500
      }
    );

    return true;
  }
}
