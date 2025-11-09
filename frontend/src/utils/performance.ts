/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = __DEV__; // Only enable in development by default

  /**
   * Start measuring a performance metric
   */
  start(name: string): void {
    if (!this.enabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
    });
  }

  /**
   * End measuring a performance metric
   */
  end(name: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" was not started`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    console.log(`⏱️ ${name}: ${metric.duration.toFixed(2)}ms`);

    return metric.duration;
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get average duration for a metric across multiple measurements
   */
  getAverage(name: string): number | null {
    const matchingMetrics = Array.from(this.metrics.values()).filter(
      (m) => m.name === name && m.duration !== undefined
    );

    if (matchingMetrics.length === 0) return null;

    const sum = matchingMetrics.reduce((acc, m) => acc + (m.duration || 0), 0);
    return sum / matchingMetrics.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring async function performance
 */
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(metricName, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Log render performance
 */
export function logRenderTime(componentName: string, renderTime: number): void {
  if (__DEV__ && renderTime > 16) {
    // Warn if render takes longer than one frame (16ms at 60fps)
    console.warn(
      `⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`
    );
  }
}

/**
 * Measure component render time
 */
export function useRenderTime(componentName: string): void {
  if (!__DEV__) return;

  const startTime = performance.now();

  React.useEffect(() => {
    const renderTime = performance.now() - startTime;
    logRenderTime(componentName, renderTime);
  });
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memory usage tracking (if available)
 */
export function logMemoryUsage(): void {
  if (!__DEV__) return;

  // @ts-ignore - performance.memory is only available in some environments
  if (performance.memory) {
    // @ts-ignore
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    console.log('💾 Memory Usage:', {
      used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });
  }
}

// Add React import for useRenderTime
import React from 'react';
