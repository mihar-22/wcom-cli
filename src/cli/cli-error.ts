const ERROR_NAME = '@wcom/cliError';

// Use this function instead of subclassing Error because of problems after transpilation.
export function buildCLIError(message: string): Error {
  const error = new Error(message);
  error.name = ERROR_NAME;
  return error;
}

export function isCLIError(error: Error): boolean {
  return error.name === ERROR_NAME;
}
