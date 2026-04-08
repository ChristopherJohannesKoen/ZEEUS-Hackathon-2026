import { Injectable } from '@nestjs/common';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const defaultArtifactsRoot = path.resolve(process.cwd(), '.artifacts');

@Injectable()
export class EvaluationStorageService {
  private readonly bucket = process.env.S3_BUCKET?.trim();
  private readonly useS3 = Boolean(this.bucket && process.env.S3_ACCESS_KEY_ID);
  private readonly artifactsRoot = path.resolve(process.env.ARTIFACTS_DIR ?? defaultArtifactsRoot);
  private readonly s3Client = this.useS3
    ? new S3Client({
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE ?? 'false') === 'true',
        credentials:
          process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
              }
            : undefined
      })
    : null;

  async objectExists(storageKey: string) {
    if (!this.useS3 || !this.s3Client || !this.bucket) {
      try {
        await access(this.resolveLocalPath(storageKey));
        return true;
      } catch {
        return false;
      }
    }

    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: storageKey
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async readObject(storageKey: string) {
    if (!this.useS3 || !this.s3Client || !this.bucket) {
      return readFile(this.resolveLocalPath(storageKey));
    }

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey
      })
    );

    const bytes = await response.Body?.transformToByteArray();
    return Buffer.from(bytes ?? []);
  }

  async writeObject(storageKey: string, content: Buffer, mimeType: string) {
    if (!this.useS3 || !this.s3Client || !this.bucket) {
      const targetPath = this.resolveLocalPath(storageKey);
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, content);
      return;
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: content,
        ContentType: mimeType
      })
    );
  }

  buildStorageKey(checksumSha256: string, filename: string) {
    const extension = path.extname(filename);
    return path.posix.join('artifacts', checksumSha256.slice(0, 2), `${checksumSha256}${extension}`);
  }

  private resolveLocalPath(storageKey: string) {
    return path.join(this.artifactsRoot, storageKey.replaceAll('/', path.sep));
  }
}
