import { Config } from "effect"

export const HttpConfig = Config.nested("HTTP")(
  Config.all({
    port: Config.number("PORT"),
    host: Config.string("HOST")
  })
)

export const HoneycombConfig = Config.nested("HONEYCOMB")(
  Config.all({
    apiKey: Config.secret("API_KEY"),
    serviceName: Config.string("SERVICE_NAME")
  })
)
