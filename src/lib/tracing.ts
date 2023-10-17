import * as OtelMetrics from "@effect/opentelemetry/Metrics"
import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import * as Resource from "@effect/opentelemetry/Resource"
import * as Tracer from "@effect/opentelemetry/Tracer"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { ConfigSecret, Effect, Layer } from "effect"
import { HoneycombConfig } from "./config"

export const TracingLive = Layer.unwrapEffect(
  Effect.gen(function*(_) {
    const { apiKey, serviceName } = yield* _(
      Effect.config(HoneycombConfig),
      Effect.orDie
    )
    const headers = {
      "x-honeycomb-team": ConfigSecret.value(apiKey),
      "x-honeycomb-dataset": serviceName
    }
    const metricExporter = new OTLPMetricExporter({
      url: "https://api.honeycomb.io/v1/metrics",
      headers
    })
    const traceExporter = new OTLPTraceExporter({
      url: "https://api.honeycomb.io/v1/traces",
      headers
    })
    const metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 1000
    })
    const sdkConfig = NodeSdk.config({
      traceExporter
    })
    return Layer.provide(
      Resource.layer({ serviceName }),
      Layer.mergeAll(
        NodeSdk.layer(() => sdkConfig),
        OtelMetrics.layer(() => metricReader),
        Tracer.layer
      )
    )
  })
)
