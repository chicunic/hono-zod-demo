import assert from "node:assert/strict";

/** A fetch `Response` reduced to the fields tests assert on, with the body pre-parsed. */
export interface TestResponse {
  status: number;
  body: unknown;
  headers: Headers;
}

/** Minimal shape of a Hono/OpenAPIHono app needed to drive requests — avoids coupling to Hono's generics. */
interface RequestableApp {
  request(input: string | URL | Request, requestInit?: RequestInit): Response | Promise<Response>;
}

/** Drives a Hono app via `app.request()` (no network). Each method returns a {@link TestResponse} with the body pre-parsed; JSON bodies get a `content-type` header automatically. */
export class RestTestHelper {
  constructor(private readonly app: RequestableApp) {}

  private async send(
    method: string,
    url: string,
    data?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<TestResponse> {
    const hdrs = new Headers(headers);
    const init: RequestInit = { method, headers: hdrs };
    if (data !== undefined) {
      hdrs.set("content-type", "application/json");
      init.body = JSON.stringify(data);
    }

    const res = await this.app.request(url, init);

    let body: unknown;
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    return { status: res.status, body, headers: res.headers };
  }

  get(url: string, headers?: Record<string, string>): Promise<TestResponse> {
    return this.send("GET", url, undefined, headers);
  }

  post(url: string, data?: Record<string, unknown>, headers?: Record<string, string>): Promise<TestResponse> {
    return this.send("POST", url, data, headers);
  }

  patch(url: string, data?: Record<string, unknown>, headers?: Record<string, string>): Promise<TestResponse> {
    return this.send("PATCH", url, data, headers);
  }

  delete(url: string, headers?: Record<string, string>): Promise<TestResponse> {
    return this.send("DELETE", url, undefined, headers);
  }
}

export const restAssert = {
  /** Assert a 2xx (or the given) status. A body is required unless the status is 204 No Content. */
  expectSuccess(response: TestResponse, expectedStatus = 200): void {
    assert.equal(
      response.status,
      expectedStatus,
      `Expected status ${String(expectedStatus)}, got ${String(response.status)}`,
    );
    if (expectedStatus !== 204) {
      assert.notEqual(response.body, undefined, "Expected response body to be defined");
    }
  },

  /** Assert an error status and, optionally, that the RFC 9457 message contains a substring. */
  expectError(response: TestResponse, expectedStatus: number, expectedMessage?: string): void {
    assert.equal(
      response.status,
      expectedStatus,
      `Expected status ${String(expectedStatus)}, got ${String(response.status)}`,
    );
    // RFC 9457 Problem Details: the human-readable message lives in `detail` (with `title` as fallback).
    const body = response.body as { detail?: string; title?: string };
    const message = body.detail ?? body.title;
    assert.ok(message, "Expected problem detail/title to be defined");
    if (expectedMessage) {
      assert.ok(
        message.includes(expectedMessage),
        `Expected problem message to contain "${expectedMessage}", got "${message}"`,
      );
    }
  },
};
