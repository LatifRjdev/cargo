import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get('MINIO_BUCKET') || 'cargo-photos';
    const endpoint = this.config.get('MINIO_ENDPOINT') || 'localhost';
    const port = parseInt(this.config.get('MINIO_PORT') || '9000', 10);
    this.publicUrl = `http://${endpoint}:${port}/${this.bucket}`;

    this.client = new Minio.Client({
      endPoint: endpoint,
      port,
      useSSL: false,
      accessKey: this.config.get('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.config.get('MINIO_SECRET_KEY') || 'minioadmin',
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        // Set public read policy
        const policy = {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          }],
        };
        await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
      }
      console.log(`[Upload] MinIO bucket "${this.bucket}" ready`);
    } catch (err) {
      console.warn(`[Upload] MinIO not available: ${(err as Error).message}. Photo upload will fail.`);
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'parcels'): Promise<string> {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const objectName = `${folder}/${randomUUID()}.${ext}`;

    await this.client.putObject(this.bucket, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    return `${this.publicUrl}/${objectName}`;
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const objectName = url.replace(`${this.publicUrl}/`, '');
      await this.client.removeObject(this.bucket, objectName);
    } catch {
      // silently fail
    }
  }
}
