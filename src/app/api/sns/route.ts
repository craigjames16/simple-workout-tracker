import { NextResponse } from 'next/server';
import { verifySNSMessage } from '@/lib/sns';
import { createPlan } from '@/services/planService';

interface SNSMessage {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  SubscribeURL: string;
}

export async function POST(request: Request) {
  console.log('Received SNS message');
  try {
    const rawBody = await request.text();
    const message: SNSMessage = JSON.parse(rawBody);

    // Verify the message signature
    const isValid = await verifySNSMessage(message, rawBody);
    if (!isValid) {
      console.log('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // For subscription confirmation
    if (message.Type === 'SubscriptionConfirmation') {
      // Verify the subscription is from your expected SNS topic
      if (!message.TopicArn.startsWith(process.env.AWS_SNS_TOPIC_ARN!)) {
        return NextResponse.json({ error: 'Invalid SNS topic' }, { status: 403 });
      }

      // Confirm the subscription by making a GET request to the SubscribeURL
      const response = await fetch(message.SubscribeURL);
      if (!response.ok) {
        throw new Error('Failed to confirm subscription');
      }

      return NextResponse.json({ message: 'Subscription confirmed' });
    }

    // For actual notifications
    if (message.Type === 'Notification') {
      console.log('Notification message received');
      const payload = JSON.parse(message.Message);
      console.log('Payload:', payload);
      
      await createPlan(payload);

      return NextResponse.json({ message: 'Notification processed successfully' });
    }

    return NextResponse.json({ error: 'Unsupported message type' }, { status: 400 });
  } catch (error) {
    console.error('Error processing SNS message:', error);
    return NextResponse.json(
      { 
        error: 'Error processing SNS message', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 