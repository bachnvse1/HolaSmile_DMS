// filepath: d:\HolaSmile\HolaSmile_DMS\frontend\src\lib\queryMiddleware.ts
// Request và response logger cho useSchedule
export const createLoggerMiddleware = <TData = unknown, TError = unknown, TVariables = unknown, TContext = unknown>() => {
  return {
    onMutate: async (variables: TVariables) => {
      console.log('Mutation variables:', variables);
      return { variables } as TContext;
    },
    onSuccess: (data: TData, variables: TVariables, context: TContext) => {
      console.log('Mutation successful!');
      console.log('Variables:', variables);
      console.log('Response data:', data);
      console.log('Context:', context);
      return { data, variables, context };
    },
    onError: (error: TError, variables: TVariables, context: TContext) => {
      console.error('Mutation error!');
      console.error('Error:', error);
      console.error('Variables:', variables);
      console.error('Context:', context);
      return { error, variables, context };
    },
    onSettled: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext) => {
      console.log('Mutation settled!');
      console.log('Final state:', { data, error, variables, context });
    },
  };
};