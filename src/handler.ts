import {
  Callback,
  CloudFrontResponseEvent,
  Context,
  Handler,
} from 'aws-lambda';

const resizeHandler: Handler = async (
  event: CloudFrontResponseEvent,
  context: Context,
  callback: Callback,
): Promise<void> => {
  const { response } = event.Records[0].cf;
  return callback(null, response);
};

export { resizeHandler };
