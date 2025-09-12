import { useState, useEffect, useCallback } from 'react';

interface TabVisibilityOptions {
  /**
   * Callback when the tab becomes visible
   */
  onShow?: () => void;
  
  /**
   * Callback when the tab becomes hidden
   */
  onHide?: () => void;
  
  /**
   * Callback when the window gains focus
   */
  onFocus?: () => void;
  
  /**
   * Callback when the window loses focus
   */
  onBlur?: () => void;
  
  /**
   * Whether to listen to window focus/blur events
   * @default true
   */
  trackWindowFocus?: boolean;
}

/**
 * A custom hook to track tab visibility and window focus
 * @param options - Configuration options for the hook
 * @returns Object containing visibility and focus states
 * 
 * @example
 * // Basic usage
 * const { isVisible, isFocused } = useTabVisibility();
 * 
 * // With callbacks
 * const { isVisible } = useTabVisibility({
 *   onShow: () => console.log('Tab is now visible'),
 *   onHide: () => console.log('Tab is now hidden'),
 *   onFocus: () => console.log('Window is focused'),
 *   onBlur: () => console.log('Window lost focus')
 * });
 */
const useTabVisibility = (options: TabVisibilityOptions = {}) => {
  const {
    onShow,
    onHide,
    onFocus,
    onBlur,
    trackWindowFocus = true,
  } = options;
  
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [isFocused, setIsFocused] = useState(document.hasFocus());

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    const visible = !document.hidden;
    setIsVisible(visible);
    
    if (visible) {
      onShow?.();
    } else {
      onHide?.();
    }
  }, [onShow, onHide]);

  // Handle window focus/blur
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  // Set up event listeners
  useEffect(() => {
    // Tab visibility events
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Window focus/blur events
    if (trackWindowFocus) {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
    }

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (trackWindowFocus) {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      }
    };
  }, [handleVisibilityChange, handleFocus, handleBlur, trackWindowFocus]);

  return {
    /**
     * Whether the tab is currently visible
     */
    isVisible,
    
    /**
     * Whether the window is currently focused
     */
    isFocused,
    
    /**
     * Whether the tab is active (visible and focused)
     */
    isActive: isVisible && isFocused,
  };
};

export default useTabVisibility;
