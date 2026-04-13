import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import HistoryPage from './HistoryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('HistoryPage', () => {
  it('renders HistoryPage with tabs', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HistoryPage />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Prediction History/i)).toBeInTheDocument();
    expect(screen.getByText(/All/i)).toBeInTheDocument();
    expect(screen.getByText(/Malignant/i)).toBeInTheDocument();
    expect(screen.getByText(/Benign/i)).toBeInTheDocument();
  });
});
