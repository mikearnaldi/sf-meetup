import * as OtelMetrics from "@effect/opentelemetry/Metrics"
import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import * as Resource from "@effect/opentelemetry/Resource"
import * as Tracer from "@effect/opentelemetry/Tracer"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { ConfigSecret, Effect, Layer } from "effect"
import { HoneycombConfig } from "./config"

const HoneycombLive = Layer.unwrapEffect(
  Effect.gen(function*(_) {
    const { apiKey, dataset } = yield* _(Effect.config(HoneycombConfig))
    const headers = {
      "x-honeycomb-team": ConfigSecret.value(apiKey),
      "x-honeycomb-dataset": dataset
    }
    const metricExporter = new OTLPMetricExporter({
      url: "https://api.honeycomb.io/v1/metrics",
      headers
    })
    const traceExporter = new OTLPTraceExporter({
      url: "https://api.honeycomb.io/v1/traces",
      headers
    })
    return Layer.mergeAll(
      NodeSdk.layer(() =>
        NodeSdk.config({
          traceExporter
        })
      ),
      OtelMetrics.layer(() =>
        new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 1000
        })
      )
    )
  })
)

export const TracingLive = Layer.provide(
  Resource.layer({ serviceName: "my-rpc-demo" }),
  Layer.mergeAll(HoneycombLive, Tracer.layer)
)
