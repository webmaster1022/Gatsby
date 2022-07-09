import { BulkQuery } from "./bulk-query"

export class ProductVariantsQuery extends BulkQuery {
  query(date?: Date): string {
    const publishedStatus = this.pluginOptions.salesChannel
      ? `'${encodeURIComponent(this.pluginOptions.salesChannel)}:visible'`
      : `published`

    const filters = [`status:active`, `published_status:${publishedStatus}`]
    if (date) {
      const isoDate = date.toISOString()
      filters.push(`created_at:>='${isoDate}' OR updated_at:>='${isoDate}'`)
    }

    const includeLocations =
      !!this.pluginOptions.shopifyConnections?.includes(`locations`)

    const queryString = filters.map(f => `(${f})`).join(` AND `)

    const query = `
      {
        productVariants(query: "${queryString}") {
          edges {
            node {
              availableForSale
              barcode
              compareAtPrice
              createdAt
              displayName
              id
              image {
                altText
                height
                id
                originalSrc
                src
                transformedSrc
                width
              }
              inventoryItem @include(if: ${includeLocations}) {
                countryCodeOfOrigin
                createdAt
                duplicateSkuCount
                harmonizedSystemCode
                id
                inventoryHistoryUrl
                inventoryLevels {
                  edges {
                    node {
                      available
                      id
                      location {
                        id
                      }
                    }
                  }
                }
                legacyResourceId
                locationsCount
                provinceCodeOfOrigin
                requiresShipping
                sku
                tracked
                trackedEditable {
                  locked
                  reason
                }
                unitCost {
                  amount
                  currencyCode
                }
                updatedAt
                variant {
                  id
                }
              }
              inventoryPolicy
              inventoryQuantity
              legacyResourceId
              media {
                edges {
                  node {
                    ... on ExternalVideo {
                      id
                    }
                    ... on MediaImage {
                      id
                    }
                    ... on Model3d {
                      id
                    }
                    ... on Video {
                      id
                    }
                  }
                }
              }
              position
              presentmentPrices {
                edges {
                  node {
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    price {
                      amount
                      currencyCode
                    }
                    __typename
                  }
                }
              }
              price
              product {
                id
              }
              requiresShipping
              selectedOptions {
                name
                value
              }
              sellingPlanGroupCount
              sku
              storefrontId
              taxCode
              taxable
              title
              updatedAt
              weight
              weightUnit
              metafields {
                edges {
                  node {
                    createdAt
                    description
                    id
                    key
                    legacyResourceId
                    namespace
                    ownerType
                    type
                    updatedAt
                    value
                    valueType: type
                  }
                }
              }
            }
          }
        }
      }
    `

    return this.bulkOperationQuery(query)
  }
}
