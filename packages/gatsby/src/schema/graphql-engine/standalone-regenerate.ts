#!/usr/bin/env node

/*
this is used for development purposes only
to be able to run `gatsby build` once to source data
and print schema and then just rebundle graphql-engine
with source file changes and test re-built engine quickly

Usage:
There need to be at least one successful `gatsby build`
before starting to use this script (warm up datastore,
generate "page-ssr" bundle). Once that's done you can
run following command in test site directory:

```shell
node node_modules/gatsby/dist/schema/graphql-engine/standalone-regenerate.js
```
*/

import { createGraphqlEngineBundle } from "./bundle-webpack"
import reporter from "gatsby-cli/lib/reporter"
import { loadConfigAndPlugins } from "../../utils/worker/child/load-config-and-plugins"
import * as fs from "fs-extra"
import { validateEngines } from "../../utils/validate-engines"

async function run(): Promise<void> {
  // load config
  console.log(`loading config and plugins`)
  await loadConfigAndPlugins({
    siteDirectory: process.cwd(),
  })

  try {
    console.log(`clearing webpack cache\n\n`)
    // get rid of cache if it exist
    await fs.remove(process.cwd() + `/.cache/webpack/query-engine`)
  } catch (e) {
    // eslint-disable no-empty
  }

  // recompile
  const buildActivityTimer = reporter.activityTimer(
    `Building Rendering Engines`
  )
  try {
    buildActivityTimer.start()
    await createGraphqlEngineBundle(process.cwd(), reporter, true)
  } catch (err) {
    buildActivityTimer.panic(err)
  } finally {
    buildActivityTimer.end()
  }

  // validate
  const validateEnginesActivity = reporter.activityTimer(
    `Validating Rendering Engines`
  )
  validateEnginesActivity.start()
  try {
    await validateEngines(process.cwd())
  } catch (error) {
    validateEnginesActivity.panic({ id: `98001`, context: {}, error })
  } finally {
    validateEnginesActivity.end()
  }

  console.log(`DONE`)
}

run()
