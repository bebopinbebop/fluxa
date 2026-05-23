import type { S3Event } from 'aws-lambda';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3 = new S3Client({});
const ORIGINAL_SEGMENT = '/original/';
const PROCESSED_SEGMENT = '/processed/';
const OUTPUT_SIZE = 512;

export const handler = async (event: S3Event) => {
  for (const record of event.Records ?? []) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    if (!key.startsWith('profile-images/') || !key.includes(ORIGINAL_SEGMENT)) {
      console.log('[ProfileImage] skipping non-original object', { bucket, key });
      continue;
    }

    const processedKey = key.replace(ORIGINAL_SEGMENT, PROCESSED_SEGMENT).replace(/\.[^.]+$/, '.jpg');
    console.log('[ProfileImage] processing upload', { bucket, key, processedKey });

    const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const input = await object.Body?.transformToByteArray();

    if (!input?.byteLength) {
      console.log('[ProfileImage] object body was empty', { bucket, key });
      continue;
    }

    const output = await sharp(Buffer.from(input))
      .rotate()
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 82,
        mozjpeg: true,
      })
      .toBuffer();

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: processedKey,
        Body: output,
        ContentType: 'image/jpeg',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log('[ProfileImage] processed image saved and original deleted', {
      bucket,
      processedKey,
      bytes: output.byteLength,
    });
  }
};
