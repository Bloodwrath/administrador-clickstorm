import { useEffect, useRef, useCallback } from 'react';

interface UseDocumentTitleOptions {
  /**
   * The title to display in the browser tab
   */
  title: string;
  
  /**
   * Whether to include the app name in the title
   * @default true
   */
  includeAppName?: boolean;
  
  /**
   * The separator between the title and app name
   * @default '|'
   */
  separator?: string;
  
  /**
   * The app name to display
   * @default 'Business Manager'
   */
  appName?: string;
  
  /**
   * Whether to restore the previous title on unmount
   * @default true
   */
  restoreOnUnmount?: boolean;
}

/**
 * A custom hook to manage the document title
 * @param options - Configuration options for the document title
 * @example
 * // Basic usage
 * useDocumentTitle({ title: 'Dashboard' });
 * // Result: "Dashboard | Business Manager"
 * 
 * // Custom app name
 * useDocumentTitle({ 
 *   title: 'Profile', 
 *   appName: 'My App',
 *   separator: '❯',
 * });
 * // Result: "Profile ❯ My App"
 */
const useDocumentTitle = ({
  title,
  includeAppName = true,
  separator = '|',
  appName = 'Business Manager',
  restoreOnUnmount = true,
}: UseDocumentTitleOptions) => {
  const defaultTitle = useRef<string>(document.title);
  
  // Store the original title on first render
  useEffect(() => {
    defaultTitle.current = document.title;
  }, []);
  
  useEffect(() => {
    // Set the new document title
    const newTitle = includeAppName 
      ? `${title} ${separator} ${appName}`
      : title;
    
    document.title = newTitle;
    
    // Restore the original title on unmount if specified
    return () => {
      if (restoreOnUnmount) {
        document.title = defaultTitle.current;
      }
    };
  }, [title, includeAppName, separator, appName, restoreOnUnmount]);
  
  // Return a function to manually reset the title
  const resetTitle = useCallback(() => {
    document.title = defaultTitle.current;
  }, []);
  
  return { resetTitle };
};

export default useDocumentTitle;
