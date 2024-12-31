import { SNS } from 'aws-sdk';
import crypto from 'crypto';

export async function subscribeToTopic(topicArn: string, apiEndpoint: string) {
    console.log('Subscribing to topic:', topicArn, 'with endpoint:', apiEndpoint);

  const sns = new SNS({ 
    apiVersion: '2010-03-31',
    region: process.env.AWS_REGION 
  });

  const params = {
    Protocol: 'https',
    TopicArn: topicArn,
    Endpoint: `${apiEndpoint}/api/sns`
  };

  try {
    const data = await sns.subscribe(params).promise();
    console.log('Subscription ARN:', data.SubscriptionArn);
    return data.SubscriptionArn;
  } catch (err) {
    console.error('Error subscribing to topic:', err);
    throw err;
  }
}

export async function verifySNSMessage(message: any, rawBody: string) {
  const certResponse = await fetch(message.SigningCertURL);
  const cert = await certResponse.text();

  try {
    const stringToSign = ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type']
        .filter(key => message[key] !== undefined)
        .map(key => `${key}\n${message[key]}\n`)
        .join('');

    const verifier = crypto.createVerify('RSA-SHA1');
    verifier.update(stringToSign, 'utf8');
    
    const signature = Buffer.from(message.Signature, 'base64');
    return verifier.verify(cert, signature);
  } catch (error) {
      console.error('Error verifying SNS message:', error);
      return false;
  }
} 