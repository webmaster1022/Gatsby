import Joi from "joi"
import reporter from "gatsby-cli/lib/reporter"
import type { IGatsbyFunction } from "../../internal"
import type {
  GatsbyFunctionBodyParserCommonMiddlewareConfig,
  GatsbyFunctionBodyParserUrlencodedConfig,
} from "gatsby"

const DEFAULT_LIMIT = `100kb`

// similar to `GatsbyFunctionBodyParserConfig` and `IGatsbyFunctionConfigProcessed`
// from index.d.ts, just with fields required (not optional).
// `createConfig()` will fill in defaults
export interface IGatsbyBodyParserConfigProcessed {
  json: GatsbyFunctionBodyParserCommonMiddlewareConfig
  raw: GatsbyFunctionBodyParserCommonMiddlewareConfig
  text: GatsbyFunctionBodyParserCommonMiddlewareConfig
  urlencoded: GatsbyFunctionBodyParserUrlencodedConfig
}
export interface IGatsbyFunctionConfigProcessed {
  bodyParser: IGatsbyBodyParserConfigProcessed
}

const defaultBodyParserOptions: GatsbyFunctionBodyParserCommonMiddlewareConfig =
  {
    limit: DEFAULT_LIMIT,
  }
const defaultUrlEncoded = { extended: true }
const defaultConfig = {
  bodyParser: {
    text: defaultBodyParserOptions,
    raw: defaultBodyParserOptions,
    json: defaultBodyParserOptions,
    urlencoded: { ...defaultBodyParserOptions, ...defaultUrlEncoded },
  },
}

let warnings: Array<{
  property: string | null
  original: any
  expectedType: string
  replacedWith: any
}> = []

function bodyParserConfigFailover(
  property: keyof IGatsbyBodyParserConfigProcessed,
  expectedType: string
): any {
  return function actualFailover(_, { original }): any {
    warnings.push({
      property: `bodyParser.${property}`,
      original,
      expectedType,
      replacedWith: defaultConfig.bodyParser[property],
    })

    return defaultConfig.bodyParser[property]
  }
}

const functionConfigSchema: Joi.ObjectSchema<IGatsbyFunctionConfigProcessed> =
  Joi.object()
    .keys({
      bodyParser: Joi.object()
        .keys({
          json: Joi.object()
            .keys({
              type: Joi.string(),
              limit: Joi.alternatives(Joi.string(), Joi.number()),
            })
            .default(defaultConfig.bodyParser.json)
            .failover(
              bodyParserConfigFailover(
                `json`,
                `{\n  type?: string\n  limit?: string | number\n}`
              )
            )
            .unknown(false),
          text: Joi.object()
            .keys({
              type: Joi.string(),
              limit: Joi.alternatives(Joi.string(), Joi.number()),
            })
            .unknown(false)
            .default(defaultConfig.bodyParser.text)
            .failover(
              bodyParserConfigFailover(
                `text`,
                `{\n  type?: string\n  limit?: string | number\n}`
              )
            ),
          raw: Joi.object()
            .keys({
              type: Joi.string(),
              limit: Joi.alternatives(Joi.string(), Joi.number()),
            })
            .unknown(false)
            .default(defaultConfig.bodyParser.raw)
            .failover(
              bodyParserConfigFailover(
                `raw`,
                `{\n  type?: string\n  limit?: string | number\n}`
              )
            ),
          urlencoded: Joi.object()
            .keys({
              type: Joi.string(),
              limit: Joi.alternatives(Joi.string(), Joi.number()),
              extended: Joi.boolean().required(),
            })
            .unknown(false)
            .default(defaultConfig.bodyParser.urlencoded)
            .failover(
              bodyParserConfigFailover(
                `urlencoded`,
                `{\n  type?: string\n  limit: string | number\n  extended: boolean\n}`
              )
            ),
        })
        .unknown(false)
        .default(defaultConfig.bodyParser)
        .failover((_, { original }) => {
          warnings.push({
            property: `bodyParser`,
            original,
            expectedType: `{\n  text?: GatsbyFunctionBodyParserCommonMiddlewareConfig\n  json?: GatsbyFunctionBodyParserCommonMiddlewareConfig\n  raw?: GatsbyFunctionBodyParserCommonMiddlewareConfig\n  urlencoded?: GatsbyFunctionBodyParserUrlencodedConfig\n}`,
            replacedWith: defaultConfig.bodyParser,
          })
          return defaultConfig.bodyParser
        }),
    })
    .unknown(false)
    .default(defaultConfig)
    .failover((_, { original }) => {
      warnings.push({
        property: null,
        original,
        expectedType: `{\n  bodyParser?: GatsbyFunctionBodyParserConfig\n}`,
        replacedWith: defaultConfig,
      })
      return defaultConfig
    })

export function createConfig(
  userConfig: unknown,
  functionObj: IGatsbyFunction
): IGatsbyFunctionConfigProcessed {
  warnings = []
  const { value } = functionConfigSchema.validate(userConfig)

  if (warnings.length) {
    for (const warning of warnings) {
      reporter.warn(
        `${
          warning.property
            ? `\`${warning.property}\` property of exported config`
            : `Exported config`
        } in \`${
          functionObj.originalRelativeFilePath
        }\` is misconfigured.\nExpected object:\n\n${
          warning.expectedType
        }\n\nGot:\n\n${JSON.stringify(
          warning.original
        )}\n\nUsing default:\n\n${JSON.stringify(
          warning.replacedWith,
          null,
          2
        )}`
      )
    }
  }

  return value
}
