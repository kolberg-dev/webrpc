/* eslint-disable */
// webrpc-sse-chat v1.0.0 a63a64964867e7edb412b0400e36220b6057c41c
// --
// Code generated by webrpc-gen@v0.13.0 with typescript generator. DO NOT EDIT.
//
// webrpc-gen -schema=chat.ridl -target=typescript -client -out=./rpc.ts

// WebRPC description and code-gen version
export const WebRPCVersion = "v1";

// Schema version of your RIDL schema
export const WebRPCSchemaVersion = "v1.0.0";

// Schema hash generated from your RIDL schema
export const WebRPCSchemaHash = "a63a64964867e7edb412b0400e36220b6057c41c";

//
// Types
//

export interface Message {
  id: number;
  text: string;
  authorName: string;
  createdAt: string;
}

export interface Chat {
  sendMessage(
    args: SendMessageArgs,
    headers?: object,
    signal?: AbortSignal
  ): Promise<SendMessageReturn>;
  subscribeMessages(
    args: SubscribeMessagesArgs,
    hooks: {
      onMessage: (message: Message) => void;
      onOpen?: () => void;
      onClose?: () => void;
      onError: (error: string) => void;
    },
    headers?: object,
    signal?: AbortSignal
  ): Promise<void>;
}

export interface SendMessageArgs {
  authorName: string;
  text: string;
}

export interface SendMessageReturn {}
export interface SubscribeMessagesArgs {
  serverTimeoutSec: number;
}

//
// Client
//
export class Chat implements Chat {
  protected hostname: string;
  protected fetch: Fetch;
  protected path = "/rpc/Chat/";

  constructor(hostname: string, fetch: Fetch) {
    this.hostname = hostname;
    this.fetch = (input: RequestInfo, init?: RequestInit) => fetch(input, init);
  }

  private url(name: string): string {
    return this.hostname + this.path + name;
  }

  sendMessage = (
    args: SendMessageArgs,
    headers?: object,
    signal?: AbortSignal
  ): Promise<SendMessageReturn> => {
    return this.fetch(
      this.url("SendMessage"),
      createHTTPRequest(args, headers, signal)
    ).then(
      (res) => {
        return buildResponse(res).then((_data) => {
          return {};
        });
      },
      (error) => {
        throw WebrpcRequestFailedError.new({
          cause: `fetch(): ${error.message || ""}`,
        });
      }
    );
  };

  subscribeMessages = (
    args: SubscribeMessagesArgs,
    hooks: {
      onMessage: (message: Message) => void;
      onOpen?: () => void;
      onClose?: () => void;
      onError: (error: string) => void;
    },
    headers?: object,
    signal?: AbortSignal
  ): Promise<void> => {
    return this.fetch(
      this.url("SubscribeMessages"),
      createHTTPRequest(args, headers, signal)
    )
      .then(
        async (res) => {
          if (!res.ok || !res.body) {
            hooks.onError(`HTTP error! status: ${res.status}`);
            return;
          }
          hooks.onOpen && hooks.onOpen();
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value);
            let lines = buffer.split("\n");
            for (let i = 0; i < lines.length - 1; i++) {
              try {
                let json = JSON.parse(lines[i]);
                hooks.onMessage && hooks.onMessage(json.message);
              } catch (e) {
                //@ts-ignore
                hooks.onError(`Error parsing JSON: ${e.message}`);
              }
            }
            buffer = lines[lines.length - 1];
          }
        },
        (error) => {
          hooks.onError(error.message || "");
        }
      )
      .then(() => {
        hooks.onClose && hooks.onClose();
      });
  };
}

const createHTTPRequest = (
  body: object = {},
  headers: object = {},
  signal: AbortSignal | null = null
): object => {
  return {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    signal,
  };
};

const buildResponse = (res: Response): Promise<any> => {
  return res.text().then((text) => {
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      let message = "";
      if (error instanceof Error) {
        message = error.message;
      }
      throw WebrpcBadResponseError.new({
        status: res.status,
        cause: `JSON.parse(): ${message}: response text: ${text}`,
      });
    }
    if (!res.ok) {
      const code: number = typeof data.code === "number" ? data.code : 0;
      throw (webrpcErrorByCode[code] || WebrpcError).new(data);
    }
    return data;
  });
};

//
// Errors
//

export class WebrpcError extends Error {
  name: string;
  code: number;
  message: string;
  status: number;
  cause?: string;

  /** @deprecated Use message instead of msg. Deprecated in webrpc v0.11.0. */
  msg: string;

  constructor(
    name: string,
    code: number,
    message: string,
    status: number,
    cause?: string
  ) {
    super(message);
    this.name = name || "WebrpcError";
    this.code = typeof code === "number" ? code : 0;
    this.message = message || `endpoint error ${this.code}`;
    this.msg = this.message;
    this.status = typeof status === "number" ? status : 0;
    this.cause = cause;
    Object.setPrototypeOf(this, WebrpcError.prototype);
  }

  static new(payload: any): WebrpcError {
    return new this(
      payload.error,
      payload.code,
      payload.message || payload.msg,
      payload.status,
      payload.cause
    );
  }
}

// Webrpc errors

export class WebrpcEndpointError extends WebrpcError {
  constructor(
    name: string = "WebrpcEndpoint",
    code: number = 0,
    message: string = "endpoint error",
    status: number = 0,
    cause?: string
  ) {
    super(name, code, message, status, cause);
    Object.setPrototypeOf(this, WebrpcEndpointError.prototype);
  }
}

export class WebrpcRequestFailedError extends WebrpcError {
  constructor(
    name: string = "WebrpcRequestFailed",
    code: number = -1,
    message: string = "request failed",
    status: number = 0,
    cause?: string
  ) {
    super(name, code, message, status, cause);
    Object.setPrototypeOf(this, WebrpcRequestFailedError.prototype);
  }
}

export class WebrpcBadRouteError extends WebrpcError {
  constructor(
    name: string = "WebrpcBadRoute",
    code: number = -2,
    message: string = "bad route",
    status: number = 0,
    cause?: string
  ) {
    super(name, code, message, status, cause);
    Object.setPrototypeOf(this, WebrpcBadRouteError.prototype);
  }
}

export class WebrpcBadMethodError extends WebrpcError {
  constructor(
    name: string = "WebrpcBadMethod",
    code: number = -3,
    message: string = "bad method",
    status: number = 0,
    cause?: string
  ) {
    super(name, code, message, status, cause);
    Object.setPrototypeOf(this, WebrpcBadMethodError.prototype);
  }
}

export class WebrpcBadRequestError extends WebrpcError {
  constructor(
    name: string = "WebrpcBadRequest",
    code: number = -4,
    message: string = "bad request",
    status: number = 0,
    cause?: string
  ) {
    super(name, code, message, status, cause);
    Object.setPrototypeOf(this, WebrpcBadRequestError.prototype);
  }
}

export class WebrpcBadResponseError extends WebrpcError {
  constructor(
    name: string = "WebrpcBadResponse",
    code: number = -5,
    message: string = "bad response",
    status: number = 0,
    cause?: string
  ) {
    super(name, code, message, status, cause);
    Object.setPrototypeOf(this, WebrpcBadResponseError.prototype);
  }
}

export class WebrpcServerPanicError extends WebrpcError {
  constructor(
    name: string = "WebrpcServerPanic",
    code: number = -6,
    message: string = "server panic",
    status: number = 0,
    cause?: string
  ) {
    super(name, code, message, status, cause);
    Object.setPrototypeOf(this, WebrpcServerPanicError.prototype);
  }
}

export class WebrpcInternalErrorError extends WebrpcError {
  constructor(
    name: string = "WebrpcInternalError",
    code: number = -7,
    message: string = "internal error",
    status: number = 0,
    cause?: string
  ) {
    super(name, code, message, status, cause);
    Object.setPrototypeOf(this, WebrpcInternalErrorError.prototype);
  }
}

// Schema errors

export class ConnectionTerminatedError extends WebrpcError {
  constructor(
    name: string = "ConnectionTerminated",
    code: number = 100,
    message: string = "connection terminated after 2mins",
    status: number = 0,
    cause?: string
  ) {
    super(name, code, message, status, cause);
    Object.setPrototypeOf(this, ConnectionTerminatedError.prototype);
  }
}

export enum errors {
  WebrpcEndpoint = "WebrpcEndpoint",
  WebrpcRequestFailed = "WebrpcRequestFailed",
  WebrpcBadRoute = "WebrpcBadRoute",
  WebrpcBadMethod = "WebrpcBadMethod",
  WebrpcBadRequest = "WebrpcBadRequest",
  WebrpcBadResponse = "WebrpcBadResponse",
  WebrpcServerPanic = "WebrpcServerPanic",
  WebrpcInternalError = "WebrpcInternalError",
  ConnectionTerminated = "ConnectionTerminated",
}

const webrpcErrorByCode: { [code: number]: any } = {
  [0]: WebrpcEndpointError,
  [-1]: WebrpcRequestFailedError,
  [-2]: WebrpcBadRouteError,
  [-3]: WebrpcBadMethodError,
  [-4]: WebrpcBadRequestError,
  [-5]: WebrpcBadResponseError,
  [-6]: WebrpcServerPanicError,
  [-7]: WebrpcInternalErrorError,
  [100]: ConnectionTerminatedError,
};

export type Fetch = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>;