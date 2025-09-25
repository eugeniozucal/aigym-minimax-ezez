// Placeholder useContent hook
import { useContentStore } from '@/lib/stores/contentStore'

export const useContent = () => {
  const store = useContentStore()
  
  return {
    ...store,
    // Add any additional content-specific logic here
  }
}
