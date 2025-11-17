

export type HandlerResult<TData> =
  | {
      success: true;
      data: TData;
      status: number;
    }
  | {
      success: false;
      error: string;
      status: number;
      headers?: HeadersInit;
    };

export interface RequestContext {
  
  ip: string;
  
  headers: Headers;
  
  url: URL;
}

export type Handler<TInput, TOutput> = (
  input: TInput,
  context: RequestContext
) => Promise<HandlerResult<TOutput>>;
