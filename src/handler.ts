import { AWSError, S3 } from 'aws-sdk';
import {
  Callback,
  CloudFrontResponseEvent,
  Context,
  Handler,
} from 'aws-lambda';
import querystring from 'querystring';
import { PromiseResult } from 'aws-sdk/lib/request';
import sharp, { FormatEnum, Metadata, Sharp } from 'sharp';

const s3: S3 = new S3({ region: 'ap-northeast-2' });
const bucket: string = process.env.S3_BUCKET ?? '';

const support: string[] = ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp', 'tiff'];

const resizeHandler: Handler = async (
  event: CloudFrontResponseEvent,
  context: Context,
  callback: Callback,
): Promise<void> => {
  const { request, response } = event.Records[0].cf;

  if (response.status !== '200') {
    return callback(null, response);
  }

  const key: string = decodeURIComponent(request.uri).substring(1);
  const extension: string = key.split('.').pop()?.toLowerCase() ?? 'jpeg';

  if (!support.includes(extension)) {
    return callback(null, {
      ...response,
      status: '403',
      statusDescription: 'Forbidden',
      headers: {
        ...response.headers,
        'content-type': [{ key: 'Content-Type', value: 'text/plain' }],
      },
      body: 'Forbidden',
    });
  }

  const params: { [key: string]: any } = querystring.parse(request.querystring);
  const { w, h, q, f } = params;

  if (!w && !h && !q && !f) {
    return callback(null, response);
  }

  const s3Object: PromiseResult<S3.GetObjectOutput, AWSError> = await s3
    .getObject({ Bucket: bucket, Key: key })
    .promise();

  const s3Error: AWSError | void = s3Object.$response.error;
  if (s3Error) {
    return callback(s3Error);
  }

  if (!s3Object.ContentLength) {
    return callback(null, {
      ...response,
      status: '404',
      statusDescription: 'Not Found',
      headers: {
        ...response.headers,
        'content-type': [{ key: 'Content-Type', value: 'text/plain' }],
      },
      body: 'Not Found',
    });
  }

  const origin: Buffer = s3Object.Body as Buffer;

  const width: number | undefined = w ? parseInt(w) : undefined;
  const height: number | undefined = h ? parseInt(h) : undefined;
  const quality: number = Math.max(
    q && !isNaN(Number(q)) ? parseInt(q) : 100,
    0,
  );

  const format: keyof FormatEnum = f
    ? ['jpeg', 'png', 'webp', 'tiff'].includes(f)
      ? f
      : 'jpeg'
    : extension;

  const resize = async (
    origin: Buffer,
    width: number | undefined,
    height: number | undefined,
    quality: number,
    format: keyof FormatEnum,
  ): Promise<Buffer> => {
    const image: Sharp = sharp(origin);
    const metaData: Metadata = await image.metadata();

    const { width: originWidth, height: originHeight } = metaData;
    if (!originWidth || !originHeight) {
      return await image.toBuffer();
    }

    if ((width && width < originWidth) || (height && height < originHeight)) {
      image.resize({ width, height, fit: 'contain', background: 'white' });
    }

    if (format !== extension || quality < 100) {
      image.toFormat(format, { quality });
    }

    const buffer: Buffer = await image.toBuffer();
    const length: number = Buffer.byteLength(buffer, 'base64');

    if (length > 1 * 1024 * 1024) {
      return resize(origin, width, height, quality * 0.8, format);
    }

    return buffer;
  };

  const buffer: Buffer = await resize(origin, width, height, quality, format);

  return callback(null, {
    ...response,
    status: 200,
    statusDescription: 'OK',
    headers: {
      ...response.headers,
      'content-type': [{ key: 'Content-Type', value: `image/${format}` }],
    },
    body: buffer.toString('base64'),
    bodyEncoding: 'base64',
  });
};

export { resizeHandler };
