import * as RPCSchema from "@effect/rpc-http-node/Schema"
import * as Pretty from "@effect/schema/Pretty"
import * as Schema from "@effect/schema/Schema"

export const UserId = Schema.number.pipe(
  Schema.int(),
  Schema.brand("UserId")
)
export type UserId = Schema.Schema.To<typeof UserId>

export class User extends Schema.Class<User>()({
  id: UserId,
  name: Schema.string
}) {}

export const prettyUsers = Pretty.to(Schema.array(User))

export const schema = RPCSchema.make({
  getUserIds: {
    output: Schema.chunk(UserId)
  },
  getUser: {
    input: UserId,
    output: User
  }
})
