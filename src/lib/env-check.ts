// Environment validation utility
export const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL && process.env.DATABASE_URL?.includes('dummy');

export const isRuntimeReady = () => {
  // Check if we have a real database URL (not the dummy one)
  const hasRealDatabase = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy');
  
  // Check if we're in a server environment
  const isServer = typeof window === 'undefined';
  
  return hasRealDatabase && isServer;
};

export const validateEnvironment = () => {
  if (isBuildTime) {
    console.log('Build time detected - skipping database operations');
    return false;
  }
  
  if (!isRuntimeReady()) {
    console.warn('Database not ready - operations will be skipped');
    return false;
  }
  
  return true;
}; 