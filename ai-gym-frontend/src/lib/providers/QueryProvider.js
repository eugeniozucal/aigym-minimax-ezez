import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
        },
    },
});
export function QueryProvider({ children }) {
    return (_jsxs(QueryClientProvider, { client: queryClient, children: [children, _jsx(ReactQueryDevtools, { initialIsOpen: false })] }));
}
