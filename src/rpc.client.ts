import * as Client from "@effect/rpc-http-node/Client"
import { Effect } from "effect"
import { prettyUsers, schema } from "./rpc.schema"

// Create the client
const client = Client.make(schema, { url: "http://127.0.0.1:3000" })

// Use the client
const program = Effect.gen(function*(_) {
  const ids = yield* _(client.getUserIds)
  const users = yield* _(Effect.forEach(ids, client.getUser, { concurrency: "unbounded", batching: true }))
  yield* _(Effect.logInfo(prettyUsers(users)))
})

program.pipe(
  Effect.sandbox,
  Effect.catchAll(Effect.logError),
  Effect.runFork
)
