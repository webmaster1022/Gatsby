const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const {
  addRemoteFilePolyfillInterface,
  polyfillImageServiceDevRoutes,
} = require("gatsby-plugin-utils/polyfill-remote-file")

/** @type{import('gatsby').createSchemaCustomization} */
exports.createSchemaCustomization = ({ actions, schema, store }) => {
  actions.createTypes(
    addRemoteFilePolyfillInterface(
      schema.buildObjectType({
        name: "MyRemoteFile",
        fields: {},
        interfaces: ["Node", "RemoteFile"],
      }),
      {
        store,
        schema,
        actions,
      }
    )
  )
}

/** @type {import('gatsby').sourceNodes} */
exports.sourceNodes = ({ actions, createNodeId, createContentDigest }) => {
  const items = [
    {
      name: "photoA.jpg",
      url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80",
      placeholderUrl:
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=%width%&h=%height%",
      mimeType: "image/jpg",
      filename: "photo-1517849845537.jpg",
      width: 2000,
      height: 2667,
    },
    {
      name: "photoB.jpg",
      url: "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&h=2000&q=10",
      mimeType: "image/jpg",
      filename: "photo-1552053831.jpg",
      width: 1247,
      height: 2000,
    },
    {
      name: "photoC.jpg",
      url: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80",
      placeholderUrl:
        "https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=%width%&h=%height%",
      mimeType: "image/jpg",
      filename: "photo-1561037404.jpg",
      width: 2000,
      height: 1333,
    },
  ]

  items.forEach((item, index) => {
    actions.createNode({
      id: createNodeId(`remote-file-${index}`),
      ...item,
      internal: {
        type: "MyRemoteFile",
        contentDigest: createContentDigest(item.url),
      },
    })
  })
}

/**
 * @type {import('gatsby').onCreateNode}
 */
exports.onCreateNode = function onCreateNode({
  actions: { createNodeField },
  node,
  getNode,
}) {
  switch (node.internal.type) {
    case `MarkdownRemark`: {
      const slug = createFilePath({
        node,
        getNode,
      })

      createNodeField({
        name: `slug`,
        value: slug,
        node,
      })
      break
    }

    default: {
      break
    }
  }
}

/**
 * @type {import('gatsby').createPages}
 */
exports.createPages = async function createPages({
  actions: { createPage, createRedirect },
  graphql,
}) {
  const { data } = await graphql(`
    {
      posts: allMarkdownRemark {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }

      allFakeData {
        nodes {
          fields {
            slug
          }
        }
      }
    }
  `)

  const blogPostTemplate = path.resolve(`src/templates/blog-post.js`)
  const previewItemTemplate = path.resolve(`src/templates/preview-item.js`)

  data.posts.edges.forEach(({ node }) => {
    const { slug } = node.fields
    createPage({
      path: slug,
      component: blogPostTemplate,
      context: {
        slug: slug,
      },
    })
  })

  data.allFakeData.nodes.forEach(node => {
    const { slug } = node.fields
    createPage({
      path: slug,
      component: previewItemTemplate,
      context: {
        slug,
      },
    })
  })

  createPage({
    path: `/안녕`,
    component: path.resolve(`src/pages/page-2.js`),
  })

  createPage({
    path: `/foo/@something/bar`,
    component: path.resolve(`src/pages/page-2.js`),
  })

  createPage({
    path: `/client-only-paths/static`,
    component: path.resolve(`src/templates/static-page.js`),
  })

  createRedirect({
    fromPath: `/redirect-without-page`,
    toPath: `/`,
    isPermanent: true,
    redirectInBrowser: true,
  })

  createRedirect({
    fromPath: `/redirect`,
    toPath: `/`,
    isPermanent: true,
    redirectInBrowser: true,
  })

  createRedirect({
    fromPath: `/redirect-two`,
    toPath: `/redirect-search-hash`,
    isPermanent: true,
    redirectInBrowser: true,
  })
}

/**
 * @type {import('gatsby').onCreatePage}
 */
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage, createRedirect, deletePage } = actions

  if (page.path.match(/^\/client-only-paths/)) {
    page.matchPath = `/client-only-paths/*`
    createPage(page)
  }

  if (page.path === `/redirect-me/`) {
    const toPath = `/pt${page.path}`

    deletePage(page)

    createRedirect({
      fromPath: page.path,
      toPath,
      isPermanent: false,
      redirectInBrowser: true,
      Language: `pt`,
      statusCode: 301,
    })

    createPage({
      ...page,
      path: toPath,
      context: {
        ...page.context,
        lang: `pt`,
      },
    })
  }

  if (page.path.includes(`query-data-caches`)) {
    if (page.path.includes(`with-trailing-slash`)) {
      // just make sure it actually has trailing slash
      const hasTrailingSlash = /\/$/.test(page.path)
      if (!hasTrailingSlash) {
        throw new Error(
          `Page reporting to have trailing slash, doesn't have it`
        )
      }
    }

    if (page.path.includes(`no-trailing-slash`)) {
      // strip both slashes
      deletePage(page)
      createPage({
        ...page,
        path: page.path.replace(/\/$/, ``),
      })
    }
  }
}

/**
 * @type {import('gatsby').createResolvers}
 */
exports.createResolvers = ({ createResolvers }) => {
  const resolvers = {
    QueryDataCachesJson: {
      // this field doesn't do anything useful on its own
      // it's only added so we can use it to make sure query text
      // in various queries used by `query-data-caches` is different
      // at least a little bit, so the static queries is different
      // between initial and second page
      dummy: {
        type: `String`,
        args: {
          text: {
            type: `String`,
          },
        },
        resolve(_source, args) {
          return args.text
        },
      },
    },
  }
  createResolvers(resolvers)
}

/** @type{import('gatsby').onCreateDevServer} */
exports.onCreateDevServer = ({ app, store }) => {
  polyfillImageServiceDevRoutes(app, store)
}
