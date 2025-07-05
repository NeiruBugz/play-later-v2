# 09 - Monitoring and Observability Implementation

## Problem Statement

The codebase lacks **structured monitoring and observability**, making it difficult to debug production issues, track performance metrics, and understand user behavior. This creates blind spots that prevent proactive issue resolution and performance optimization.

### Current Observability Gaps

#### ❌ Issue 1: Inconsistent Logging

```typescript
// Scattered throughout codebase
console.error("Error creating review:", error); // features/add-review/server-actions/action.ts
console.log("Slow query detected:", query); // shared/lib/db.ts
console.warn("Cache read error:", error); // hypothetical cache layer
```

#### ❌ Issue 2: No Error Tracking

- No centralized error collection
- No error categorization or alerting
- No user context in error reports
- No performance impact tracking

#### ❌ Issue 3: Limited Performance Visibility

- No application performance monitoring (APM)
- No database query performance tracking
- No external API response time monitoring
- No user experience metrics

## Comprehensive Observability Strategy

### 1. Structured Logging Infrastructure

#### ✅ Centralized Logger Service

```typescript
// shared/lib/logger/index.ts
import { createLogger, format, transports } from 'winston';
import { env } from '@/env.mjs';

export interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class Logger {
  private winston;

  constructor() {
    this.winston = createLogger({
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: {
        service: 'playlater',
        environment: env.NODE_ENV,
      },
      transports: [
        new transports.Console({
          format: env.NODE_ENV === 'development'
            ? format.combine(format.colorize(), format.simple())
            : format.json(),
        }),
        // Production: Add external logging service
        ...(env.NODE_ENV === 'production' ? [
          new transports.Http({
            host: 'your-logging-service.com',
            port: 443,
            path: '/logs',
          }),
        ] : []),
      ],
    });
  }

  info(message: string, context?: LogContext) {
    this.winston.info(message, context);
  }

  warn(message: string, context?: LogContext) {
    this.winston.warn(message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.winston.error(message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  debug(message: string, context?: LogContext) {
    this.winston.debug(message, context);
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext) {
    this.winston.info(`Performance: ${operation}`, {
      ...context,
      operation,
      duration,
      type: 'performance',
    });
  }

  // Security logging
  security(event: string, context?: LogContext) {
    this.winston.warn(`Security: ${event}`, {
      ...context,
      event,
      type: 'security',
    });
  }

  // Business logic logging
  business(event: string, context?: LogContext) {
    this.winston.info(`Business: ${event}`, {
      ...context,
      event,
      type: 'business',
    });
  }
}

export const logger = new Logger();
```

#### ✅ Request Correlation Middleware

```typescript
// shared/lib/middleware/correlation.ts
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export function withCorrelation(handler: Function) {
  return async (req: NextRequest) => {
    const correlationId = req.headers.get('x-correlation-id') || randomUUID();

    // Store correlation ID in async local storage or headers
    const response = await handler(req);

    if (response instanceof NextResponse) {
      response.headers.set('x-correlation-id', correlationId);
    }

    return response;
  };
}

// Usage in API routes
// app/api/games/route.ts
import { withCorrelation } from '@/shared/lib/middleware/correlation';

export const GET = withCorrelation(async (req: NextRequest) => {
  // Handler logic with correlation tracking
});
```

### 2. Error Tracking and Reporting

#### ✅ Error Tracking Service Integration

```typescript
// shared/lib/error-tracking/index.ts
import { env } from '@/env.mjs';
import { logger } from '@/shared/lib/logger';

interface ErrorContext {
  userId?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  tags?: Record<string, string>;
}

class ErrorTracker {
  private isProduction = env.NODE_ENV === 'production';

  async captureException(
    error: Error,
    context?: ErrorContext,
    level: 'error' | 'warning' = 'error'
  ) {
    // Log locally
    logger.error('Exception captured', error, {
      ...context,
      level,
    });

    // Send to error tracking service in production
    if (this.isProduction) {
      try {
        // Replace with your error tracking service (Sentry, Bugsnag, etc.)
        await this.sendToErrorService(error, context, level);
      } catch (trackingError) {
        logger.error('Failed to send error to tracking service', trackingError);
      }
    }
  }

  async captureMessage(
    message: string,
    context?: ErrorContext,
    level: 'info' | 'warning' | 'error' = 'info'
  ) {
    logger.info(message, context);

    if (this.isProduction) {
      try {
        await this.sendMessageToErrorService(message, context, level);
      } catch (trackingError) {
        logger.error('Failed to send message to tracking service', trackingError);
      }
    }
  }

  private async sendToErrorService(
    error: Error,
    context?: ErrorContext,
    level: 'error' | 'warning' = 'error'
  ) {
    // Implementation for your chosen error tracking service
    // Example for Sentry:
    // Sentry.withScope((scope) => {
    //   scope.setUser({ id: context?.userId });
    //   scope.setContext('request', { url: context?.url });
    //   scope.captureException(error);
    // });
  }

  private async sendMessageToErrorService(
    message: string,
    context?: ErrorContext,
    level: 'info' | 'warning' | 'error'
  ) {
    // Implementation for message tracking
  }
}

export const errorTracker = new ErrorTracker();
```

#### ✅ Enhanced Error Boundaries

```typescript
// shared/components/error-boundary.tsx
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { errorTracker } from "@/shared/lib/error-tracking";
import { logger } from "@/shared/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context
    logger.error("React error boundary caught error", error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Track error with external service
    errorTracker.captureException(error, {
      component: 'ErrorBoundary',
      tags: {
        type: 'react_error',
        boundary: 'true',
      },
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-fallback min-h-64 flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              We've been notified of this issue and are working to fix it.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### 3. Performance Monitoring

#### ✅ Performance Tracking Utilities

```typescript
// shared/lib/performance/index.ts
import { logger } from '@/shared/lib/logger';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private timers = new Map<string, number>();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string, context?: Record<string, unknown>): string {
    const timerId = `${operation}_${Date.now()}_${Math.random()}`;
    this.timers.set(timerId, performance.now());

    logger.debug(`Performance timer started: ${operation}`, {
      operation,
      timerId,
      ...context,
    });

    return timerId;
  }

  endTimer(timerId: string, context?: Record<string, unknown>): number {
    const startTime = this.timers.get(timerId);
    if (!startTime) {
      logger.warn(`Timer not found: ${timerId}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(timerId);

    logger.performance(`Timer completed: ${timerId}`, duration, context);

    // Alert on slow operations
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${timerId}`, {
        duration,
        ...context,
      });
    }

    return duration;
  }

  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const timerId = this.startTimer(operation, context);

    try {
      const result = await fn();
      this.endTimer(timerId, { ...context, success: true });
      return result;
    } catch (error) {
      this.endTimer(timerId, { ...context, success: false, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  measureSync<T>(
    operation: string,
    fn: () => T,
    context?: Record<string, unknown>
  ): T {
    const timerId = this.startTimer(operation, context);

    try {
      const result = fn();
      this.endTimer(timerId, { ...context, success: true });
      return result;
    } catch (error) {
      this.endTimer(timerId, { ...context, success: false, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Web Vitals tracking
  trackWebVitals() {
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => logger.performance('Web Vitals: CLS', metric.value, { metric: 'cls' }));
        getFID((metric) => logger.performance('Web Vitals: FID', metric.value, { metric: 'fid' }));
        getFCP((metric) => logger.performance('Web Vitals: FCP', metric.value, { metric: 'fcp' }));
        getLCP((metric) => logger.performance('Web Vitals: LCP', metric.value, { metric: 'lcp' }));
        getTTFB((metric) => logger.performance('Web Vitals: TTFB', metric.value, { metric: 'ttfb' }));
      });
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const measureAsync = performanceMonitor.measureAsync.bind(performanceMonitor);
export const measureSync = performanceMonitor.measureSync.bind(performanceMonitor);
```

#### ✅ Database Query Performance Monitoring

```typescript
// shared/lib/database/monitored-prisma.ts
import { PrismaClient } from "@prisma/client";
import { logger } from "@/shared/lib/logger";
import { performanceMonitor } from "@/shared/lib/performance";

export const createMonitoredPrismaClient = () => {
  const prisma = new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "event",
        level: "error",
      },
    ],
  });

  // Monitor query performance
  prisma.$on("query", (e) => {
    const duration = Number(e.duration);
    const operation = e.query.split(' ')[0]?.toUpperCase() || 'UNKNOWN';

    logger.performance(`Database query: ${operation}`, duration, {
      query: e.query.substring(0, 100) + (e.query.length > 100 ? '...' : ''),
      params: e.params,
      operation: 'database_query',
      queryType: operation,
    });

    // Alert on slow queries
    if (duration > 100) {
      logger.warn("Slow database query detected", {
        query: e.query,
        params: e.params,
        duration,
        timestamp: e.timestamp,
      });
    }

    // Track N+1 query patterns
    if (operation === 'SELECT' && duration < 5) {
      // Potential N+1 if many fast SELECT queries
      logger.debug("Fast SELECT query - check for N+1 pattern", {
        query: e.query.substring(0, 50),
        duration,
      });
    }
  });

  // Log database errors
  prisma.$on("error", (e) => {
    logger.error("Database error occurred", new Error(e.message), {
      target: e.target,
      timestamp: e.timestamp,
      operation: 'database_error',
    });
  });

  return prisma;
};
```

### 4. Enhanced Safe Action Client with Monitoring

```typescript
// shared/lib/safe-action-client.ts (Enhanced with monitoring)
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { getServerUserId } from "@/auth";
import { logger } from "@/shared/lib/logger";
import { performanceMonitor } from "@/shared/lib/performance";
import { errorTracker } from "@/shared/lib/error-tracking";

const safeActionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
      requiresAuth: z.boolean().default(true),
    });
  },
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error, { metadata }) => {
    const actionName = metadata?.actionName || "unknown";

    // Log error with full context
    logger.error(`Server action error: ${actionName}`, error, {
      actionName,
      operation: 'server_action',
    });

    // Track error externally
    errorTracker.captureException(error, {
      component: 'ServerAction',
      tags: {
        action: actionName,
        type: 'server_action_error',
      },
    });

    // Return appropriate user message
    if (error.message.includes("Authentication") || error.message.includes("Authorization")) {
      return error.message;
    }

    return "Something went wrong. Please try again.";
  },
});

export const authenticatedActionClient = safeActionClient.use(async ({ next, metadata }) => {
  const actionName = metadata?.actionName || 'unknown';

  return await performanceMonitor.measureAsync(
    `action:${actionName}`,
    async () => {
      if (metadata.requiresAuth) {
        const userId = await getServerUserId();
        if (!userId) {
          logger.security("Unauthenticated action attempt", {
            actionName,
            operation: 'auth_failure',
          });
          throw new Error("Authentication required. Please sign in to continue.");
        }

        logger.business("Authenticated action executed", {
          actionName,
          userId,
          operation: 'action_execution',
        });

        return next({ ctx: { userId } });
      }

      return next({ ctx: {} });
    },
    {
      actionName,
      type: 'server_action',
    }
  );
});
```

### 5. Client-Side Monitoring

#### ✅ User Experience Monitoring

```typescript
// shared/lib/monitoring/client-monitor.ts
"use client";

import { logger } from '@/shared/lib/logger';

class ClientMonitor {
  private errorBuffer: Array<{ error: Error; context?: any }> = [];
  private isOnline = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeClientMonitoring();
    }
  }

  private initializeClientMonitoring() {
    // Monitor unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error',
      });
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        type: 'unhandled_promise_rejection',
      });
    });

    // Monitor network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorBuffer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Monitor page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        logger.info('Page hidden');
      } else {
        logger.info('Page visible');
      }
    });
  }

  captureError(error: Error, context?: any) {
    const errorData = { error, context };

    if (this.isOnline) {
      this.sendError(errorData);
    } else {
      this.errorBuffer.push(errorData);
    }
  }

  private sendError(errorData: { error: Error; context?: any }) {
    // Send to your monitoring service
    logger.error('Client error captured', errorData.error, errorData.context);
  }

  private flushErrorBuffer() {
    while (this.errorBuffer.length > 0) {
      const errorData = this.errorBuffer.shift();
      if (errorData) {
        this.sendError(errorData);
      }
    }
  }

  // Track user interactions
  trackUserAction(action: string, context?: Record<string, unknown>) {
    logger.business(`User action: ${action}`, {
      action,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  // Track page performance
  trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      logger.performance(`Page load: ${pageName}`, navigation.loadEventEnd - navigation.loadEventStart, {
        page: pageName,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstByte: navigation.responseStart - navigation.requestStart,
      });
    }
  }
}

export const clientMonitor = new ClientMonitor();
```

#### ✅ Component Performance Tracking

```typescript
// shared/hooks/use-performance-tracking.ts
import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/shared/lib/performance';

export function usePerformanceTracking(componentName: string) {
  const renderStartTime = useRef<number>();
  const timerId = useRef<string>();

  useEffect(() => {
    // Track mount time
    if (renderStartTime.current) {
      const mountTime = performance.now() - renderStartTime.current;
      performanceMonitor.endTimer(timerId.current!, {
        component: componentName,
        phase: 'mount',
        duration: mountTime,
      });
    }

    return () => {
      // Track unmount
      logger.debug(`Component unmounting: ${componentName}`, {
        component: componentName,
        phase: 'unmount',
      });
    };
  }, [componentName]);

  // Track re-renders
  useEffect(() => {
    logger.debug(`Component re-rendered: ${componentName}`, {
      component: componentName,
      phase: 'update',
    });
  });

  // Start tracking on first render
  if (!renderStartTime.current) {
    renderStartTime.current = performance.now();
    timerId.current = performanceMonitor.startTimer(`component:${componentName}`, {
      component: componentName,
      phase: 'render',
    });
  }
}

// Usage in components
export function MyComponent() {
  usePerformanceTracking('MyComponent');

  return <div>Component content</div>;
}
```

## Implementation Strategy

### Phase 1: Infrastructure Setup (Week 1)

1. **Implement centralized logging service**
2. **Set up error tracking integration**
3. **Add basic performance monitoring**
4. **Create monitoring middleware**

### Phase 2: Server-Side Monitoring (Week 2)

1. **Enhance server actions with monitoring**
2. **Add database query performance tracking**
3. **Implement security event logging**
4. **Set up alerting for critical issues**

### Phase 3: Client-Side Monitoring (Week 3)

1. **Add client-side error tracking**
2. **Implement user experience monitoring**
3. **Track component performance**
4. **Monitor Web Vitals metrics**

### Phase 4: Analytics and Alerting (Week 4)

1. **Set up monitoring dashboards**
2. **Configure alerting rules**
3. **Implement performance budgets**
4. **Create monitoring documentation**

## Benefits After Implementation

### Development Benefits

- ✅ **Faster debugging**: Structured logs with context make issues easier to trace
- ✅ **Proactive issue detection**: Monitoring catches problems before users report them
- ✅ **Performance insights**: Data-driven optimization decisions

### Production Benefits

- ✅ **Reduced downtime**: Early warning systems prevent outages
- ✅ **Better user experience**: Performance monitoring ensures fast responses
- ✅ **Data-driven decisions**: Usage analytics inform feature development

### Business Benefits

- ✅ **Higher availability**: Proactive monitoring reduces service interruptions
- ✅ **Improved performance**: Continuous optimization based on real data
- ✅ **Better user satisfaction**: Faster resolution of user-facing issues

---

**Next Steps**: Implement logging infrastructure and integrate with existing error handling patterns established in [04-error-handling-standardization.md](./04-error-handling-standardization.md).
