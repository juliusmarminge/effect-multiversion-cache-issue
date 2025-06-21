import { Context, Data, Effect, Schema } from "effect";

const data = new Map<string, unknown>();

export const imaginaryAsyncDbClient = {
  get: async <T>(key: string) => data.get(key) as T | undefined,
  set: async <T>(key: string, value: T) => data.set(key, value),
};

export class ImaginaryDbClient extends Context.Tag("ImaginaryDbClient")<
  ImaginaryDbClient,
  typeof imaginaryAsyncDbClient
>() {}

export class ImaginaryDbError extends Data.TaggedError("ImaginaryDbError")<{
  cause: unknown;
}> {}

export const runQuery = <T>(key: string) =>
  Effect.tryPromise({
    try: () => imaginaryAsyncDbClient.get<T>(key),
    catch: (error) => new ImaginaryDbError({ cause: error }),
  });
