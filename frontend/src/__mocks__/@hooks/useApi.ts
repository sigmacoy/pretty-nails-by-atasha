const mockMutationResult = {
  mutate: jest.fn(),
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  data: undefined,
  error: null,
  isError: false,
  isIdle: true,
  isPending: false,
  isSuccess: false,
  status: 'idle',
  isLoading: false,
  isFulfilled: false,
  isRejected: false,
};

export const useQuery = jest.fn();
export const useMutation = jest.fn().mockImplementation(() => mockMutationResult);