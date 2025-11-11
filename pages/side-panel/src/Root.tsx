import SidePanel from './SidePanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const Root = () => {
  console.log('render Root');
  return (
    <QueryClientProvider client={queryClient}>
      <SidePanel />
    </QueryClientProvider>
  );
};
