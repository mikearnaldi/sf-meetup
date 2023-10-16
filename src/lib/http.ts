import { Console, Effect, Exit, Layer, Queue, Scope } from "effect"
import * as Http from "node:http"
import { HttpConfig } from "./config"

export interface HttpMessage {
  req: Http.IncomingMessage
  res: Http.ServerResponse
}

export const HttpLayer: <R>(
  handler: (arg: HttpMessage) => Effect.Effect<R, never, void>
) => Layer.Layer<Exclude<R, Scope.Scope>, never, never> = <R>(
  handler: (arg: {
    req: Http.IncomingMessage
    res: Http.ServerResponse
  }) => Effect.Effect<R, never, void>
) =>
  Layer.scopedDiscard(
    Console.consoleWith(({ unsafe: unsafeConsole }) =>
      Effect.gen(function*(_) {
        const { host: hostname, port } = yield* _(
          Effect.config(HttpConfig),
          Effect.orDie
        )

        const requests = yield* _(Effect.acquireRelease(
          Queue.unbounded<HttpMessage>(),
          (requests) => Queue.shutdown(requests)
        ))

        const scope = yield* _(Effect.acquireRelease(
          Scope.make(),
          (scope) => Scope.close(scope, Exit.unit)
        ))

        yield* _(
          Queue.take(requests),
          Effect.flatMap((arg) =>
            handler(arg).pipe(
              Effect.sandbox,
              Effect.catchAll(Effect.logError),
              Effect.scoped,
              Effect.forkIn(scope)
            )
          ),
          Effect.forever,
          Effect.interruptible,
          Effect.forkScoped
        )

        const server = yield* _(Effect.acquireRelease(
          Effect.sync(() =>
            Http.createServer((req, res) => {
              if (!Queue.unsafeOffer(requests, { req, res })) {
                res.end(500)
              }
            })
          ),
          (server) => Effect.sync(() => server.close())
        ))

        yield* _(
          Effect.sync(() =>
            server.listen(
              port,
              hostname,
              () => unsafeConsole.log(`Server listening on port ${hostname}:${port}`)
            )
          )
        )
      })
    )
  )
