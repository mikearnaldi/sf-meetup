import "dotenv/config"

import { Runtime as NodeRuntime } from "@effect/platform-node"
import * as Router from "@effect/rpc-http-node/Router"
import * as Server from "@effect/rpc-http-node/Server"
import { Chunk, Effect, Layer } from "effect"
import { HttpLayer } from "./lib/http"
import { TracingLive } from "./lib/tracing"
import { schema, User, UserId } from "./rpc.schema"

const getUserIds = Effect.withSpan("fetchUserIdsFromDb")(
  Effect.succeed(Chunk.map(Chunk.range(1, 100), UserId))
)

const getUser = (id: UserId) =>
  Effect.withSpan("fetchUserFromDb")(
    Effect.succeed(new User({ id, name: `User ${id}` }))
  )

const router = Router.make(schema, {
  getUserIds,
  getUser
})

const handler = Server.make(router)

const ServerLive = HttpLayer(({ req, res }) => handler(req, res))

const MainLive = Layer.provide(TracingLive, ServerLive)

Layer.launch(MainLive).pipe(
  Effect.sandbox,
  Effect.catchAll(Effect.logError),
  NodeRuntime.runMain
)
