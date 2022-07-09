const path = require(`path`)
const glob = require(`glob`)
const fs = require(`fs`)

const pkgs = glob.sync(`./packages/*`).map(p => p.replace(/^\./, `<rootDir>`))

const reGatsby = /gatsby$/
const gatsbyDir = pkgs.find(p => reGatsby.exec(p))
const gatsbyBuildDirs = [`dist`].map(dir => path.join(gatsbyDir, dir))
const builtTestsDirs = pkgs
  .filter(p => fs.existsSync(path.join(p, `src`)))
  .map(p => path.join(p, `__tests__`))
const distDirs = pkgs.map(p => path.join(p, `dist`))
const ignoreDirs = [`<rootDir>/packages/gatsby-dev-cli/verdaccio`].concat(
  gatsbyBuildDirs,
  builtTestsDirs,
  distDirs
)

const coverageDirs = pkgs.map(p => path.join(p, `src/**/*.js`))
const useCoverage = !!process.env.GENERATE_JEST_REPORT

module.exports = {
  notify: true,
  verbose: true,
  roots: pkgs,
  modulePathIgnorePatterns: ignoreDirs,
  coveragePathIgnorePatterns: ignoreDirs,
  testPathIgnorePatterns: [
    `<rootDir>/examples/`,
    `<rootDir>/dist/`,
    `<rootDir>/node_modules/`,
    `<rootDir>/packages/gatsby-admin/.cache/`,
    `<rootDir>/packages/gatsby-plugin-gatsby-cloud/src/__tests__/mocks/`,
    `<rootDir>/packages/gatsby/src/utils/worker/__tests__/test-helpers/`,
    `<rootDir>/deprecated-packages/`,
    `__tests__/fixtures`,
    `__testfixtures__/`,
  ],
  transform: {
    "^.+\\.[jt]sx?$": `<rootDir>/jest-transformer.js`,
  },
  moduleNameMapper: {
    "^highlight.js$": `<rootDir>/node_modules/highlight.js/lib/index.js`,
    "^@reach/router(.*)": `<rootDir>/node_modules/@gatsbyjs/reach-router$1`,
    "^weak-lru-cache$": `<rootDir>/node_modules/weak-lru-cache/dist/index.cjs`,
    "^ordered-binary$": `<rootDir>/node_modules/ordered-binary/dist/index.cjs`,
    "^msgpackr$": `<rootDir>/node_modules/msgpackr/dist/node.cjs`,
    "^gatsby-page-utils/(.*)$": `gatsby-page-utils/dist/$1`, // Workaround for https://github.com/facebook/jest/issues/9771
    "^gatsby-core-utils/(.*)$": `gatsby-core-utils/dist/$1`, // Workaround for https://github.com/facebook/jest/issues/9771
    "^gatsby-plugin-utils/(.*)$": [
      `gatsby-plugin-utils/dist/$1`,
      `gatsby-plugin-utils/$1`,
    ], // Workaround for https://github.com/facebook/jest/issues/9771
  },
  snapshotSerializers: [`jest-serializer-path`],
  collectCoverageFrom: coverageDirs,
  reporters: process.env.CI
    ? [[`jest-silent-reporter`, { useDots: true, showPaths: true }]].concat(
        useCoverage ? `jest-junit` : []
      )
    : [`default`].concat(useCoverage ? `jest-junit` : []),
  moduleFileExtensions: [`js`, `jsx`, `ts`, `tsx`, `json`],
  setupFiles: [`<rootDir>/.jestSetup.js`],
  setupFilesAfterEnv: [`jest-extended`],
}
