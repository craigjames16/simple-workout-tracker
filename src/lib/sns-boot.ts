import { subscribeToTopic } from './sns';

class SNSBootstrap {
  private static instance: SNSBootstrap;
  private initialized = false;

  private constructor() {}

  public static getInstance(): SNSBootstrap {
    if (!SNSBootstrap.instance) {
      SNSBootstrap.instance = new SNSBootstrap();
    }
    return SNSBootstrap.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const topicArn = process.env.AWS_SNS_TOPIC_ARN;
      const apiEndpoint = process.env.API_ENDPOINT; // e.g., https://your-domain.com/api/sns

      if (!topicArn || !apiEndpoint) {
        throw new Error('Missing required environment variables for SNS subscription');
      }

      await subscribeToTopic(topicArn, apiEndpoint);
      this.initialized = true;
      console.log('Successfully subscribed to SNS topic');
    } catch (error) {
      console.error('Failed to initialize SNS subscription:', error);
      // Don't set initialized to true so it can retry on next request
    }
  }
}

export const snsBootstrap = SNSBootstrap.getInstance();