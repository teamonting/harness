import { number, object, optional, parse, string, unknown, type InferOutput } from 'valibot';

const errorLikeSchema = object({
  cause: optional(unknown()),
  columnNumber: optional(number()),
  fileName: optional(string()),
  lineNumber: optional(number()),
  message: optional(string()),
  name: optional(string()),
  stack: optional(string())
});

type ErrorLike = InferOutput<typeof errorLikeSchema>;

export default function unmarshalError(errorLike: ErrorLike): Error {
  const parsedMarshalledError = parse(errorLikeSchema, errorLike);

  const error = new Error(parsedMarshalledError.message, {
    ...(typeof parsedMarshalledError.cause === 'undefined' ? {} : { cause: parsedMarshalledError.cause })
  });

  if (typeof parsedMarshalledError.columnNumber === 'number') {
    (error as { columnNumber?: number | undefined }).columnNumber = parsedMarshalledError.columnNumber;
  }

  if (typeof parsedMarshalledError.fileName === 'string') {
    (error as { fileName?: string | undefined }).fileName = parsedMarshalledError.fileName;
  }

  if (typeof parsedMarshalledError.lineNumber === 'number') {
    (error as { lineNumber?: number | undefined }).lineNumber = parsedMarshalledError.lineNumber;
  }

  if (typeof parsedMarshalledError.name === 'string') {
    (error as { name?: string | undefined }).name = parsedMarshalledError.name;
  }

  if (typeof parsedMarshalledError.stack === 'string') {
    (error as { stack?: string | undefined }).stack = parsedMarshalledError.stack;
  }

  return error;
}

export { errorLikeSchema };
