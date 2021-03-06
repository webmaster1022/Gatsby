const fs = require(`fs-extra`)
const path = require(`path`)

exports.onPostBuild = async ({ graphql }) => {
  const results = await graphql(`
    {
      mdx(slug: { eq: "html" }) {
        html
      }
    }
  `)

  await fs.outputJSON(
    path.join(__dirname, `public`, `html-queried-like-feed-plugin.json`),
    results,
    { spaces: 2 }
  )
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  createTypes(`
    type Mdx implements Node {
      frontmatter: Frontmatter
    }
    type Frontmatter {
      title: String
    }
  `)
}
