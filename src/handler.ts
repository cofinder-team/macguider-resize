import { AWSError, S3 } from 'aws-sdk';
import {
  Callback,
  CloudFrontResponseEvent,
  Context,
  Handler,
} from 'aws-lambda';
import { PromiseResult } from 'aws-sdk/lib/request';

const s3: S3 = new S3({ region: 'ap-northeast-2' });
const bucket: string = 'macguider-image';

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

  return callback(null, response);
};

export { resizeHandler };
