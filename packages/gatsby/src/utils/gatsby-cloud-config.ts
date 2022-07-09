import { IGatsbyConfig } from "../internal"

type ConstructConfigObjectResponse = Pick<
  IGatsbyConfig,
  "trailingSlash" | "assetPrefix" | "pathPrefix"
>

export function constructConfigObject(
  gatsbyConfig: IGatsbyConfig
): ConstructConfigObjectResponse {
  return {
    trailingSlash: gatsbyConfig.trailingSlash ?? `legacy`,
    pathPrefix: gatsbyConfig.pathPrefix ?? ``,
    ...(gatsbyConfig.assetPrefix
      ? { assetPrefix: gatsbyConfig.assetPrefix }
      : {}),
  }
}
