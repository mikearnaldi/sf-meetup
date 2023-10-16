import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

const extensions = [".js", ".jsx", ".ts", ".tsx"];

export default {
  input: ["src/rpc.server.ts", "src/rpc.client.ts"],
  output: {
    dir: "dist",
    format: "cjs",
    exports: "named",
  },
  external: ["busboy", /\@opentelemetry\/.*/, "dotenv"],
  plugins: [
    babel({
      extensions,
      babelHelpers: "bundled",
      include: ["src/**/*"],
    }),
    nodeResolve({
      extensions,
    }),
    commonjs(),
    json(),
    terser({
      mangle: true,
      compress: true,
    }),
  ],
};
