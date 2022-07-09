import { runApisInSteps } from "./utils/run-steps"
import * as steps from "./steps"

module.exports = runApisInSteps({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "onPluginInit|unstable_onPluginInit": [
    steps.setGatsbyApiToState,
    steps.setErrorMap,
    steps.tempPreventMultipleInstances,
    steps.setRequestHeaders,
  ],

  pluginOptionsSchema: steps.pluginOptionsSchema,

  createSchemaCustomization: [
    steps.setGatsbyApiToState,
    steps.ensurePluginRequirementsAreMet,
    steps.ingestRemoteSchema,
    steps.createSchemaCustomization,
  ],

  sourceNodes: [
    steps.setGatsbyApiToState,
    steps.persistPreviouslyCachedImages,
    steps.sourceNodes,
    steps.setImageNodeIdCache,
  ],

  onPreExtractQueries: [
    steps.onPreExtractQueriesInvokeLeftoverPreviewCallbacks,
  ],

  onPostBuild: [steps.setImageNodeIdCache, steps.logPostBuildWarnings],

  onCreatePage: [
    steps.onCreatepageSavePreviewNodeIdToPageDependency,
    steps.onCreatePageRespondToPreviewStatusQuery,
  ],

  onCreateDevServer: [
    steps.imageRoutes,
    steps.setImageNodeIdCache,
    steps.logPostBuildWarnings,
    steps.startPollingForContentUpdates,
  ],
})
