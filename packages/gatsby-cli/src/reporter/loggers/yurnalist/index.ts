import path from "path"
import { onLogAction } from "../../redux"
import {
  Actions,
  LogLevels,
  ActivityLogLevels,
  ActivityTypes,
} from "../../constants"

import { createReporter } from "yurnalist"
import ProgressBar from "progress"
import chalk from "chalk"
import boxen from "boxen"
import { IUpdateActivity } from "../../redux/types"
import {
  generatePageTree,
  IComponentWithPageModes,
} from "../../../util/generate-page-tree"
import { IRenderPageArgs } from "../../types"

interface IYurnalistActivities {
  [activityId: string]: {
    text: string | undefined
    statusText: string | undefined
    update(payload: IUpdateActivity["payload"]): void
    end(): void
  }
}

function generatePageTreeToConsole(
  yurnalist: any,
  state: IRenderPageArgs
): void {
  const root = state.root
  const componentWithPages = new Map<string, IComponentWithPageModes>()
  for (const { componentPath, pages } of state.components.values()) {
    const pagesByMode = {
      SSG: new Set<string>(),
      DSG: new Set<string>(),
      SSR: new Set<string>(),
      FN: new Set<string>(),
    }
    pages.forEach(pagePath => {
      const gatsbyPage = state.pages.get(pagePath)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      pagesByMode[gatsbyPage!.mode].add(pagePath)
    })

    componentWithPages.set(
      path.posix.relative(root, componentPath),
      pagesByMode
    )
  }

  for (const {
    originalAbsoluteFilePath,
    functionRoute,
  } of state.functions.values()) {
    componentWithPages.set(
      path.posix.relative(root, originalAbsoluteFilePath),
      {
        SSG: new Set<string>(),
        DSG: new Set<string>(),
        SSR: new Set<string>(),
        FN: new Set<string>([`/api/${functionRoute}`]),
      }
    )
  }

  const pageTreeConsole: Array<string> = []
  pageTreeConsole.push(`\n${chalk.underline(`Pages`)}\n`)

  let i = 0
  for (const [componentPath, pages] of componentWithPages) {
    const isLast = i === componentWithPages.size - 1
    let topLevelIcon = `├`
    if (i === 0) {
      topLevelIcon = `┌`
    }
    if (isLast) {
      topLevelIcon = `└`
    }
    const componentTree = [`${topLevelIcon} ${componentPath}`]

    const sortedPages = generatePageTree(pages)
    sortedPages.map((page, index) => {
      componentTree.push(
        [
          isLast ? ` ` : `│`,
          ` ${index === sortedPages.length - 1 ? `└` : `├`} `,
          `${page.symbol} ${page.text}`,
        ].join(``)
      )
    })

    pageTreeConsole.push(componentTree.join(`\n`))

    i++
  }

  pageTreeConsole.push(``)
  pageTreeConsole.push(
    boxen(
      [
        `  (SSG) Generated at build time`,
        `D (DSG) Deferred static generation - page generated at runtime`,
        `∞ (SSR) Server-side renders at runtime (uses getServerData)`,
        `λ (Function) Gatsby function`,
      ].join(`\n`),
      {
        padding: 1,
        margin: {
          left: 2,
          right: 2,
          top: 0,
          bottom: 0,
        },
        // @ts-ignore - bad type in boxen
        borderStyle: `round`,
      }
    )
  )

  yurnalist.log(pageTreeConsole.join(`\n`))
}

export function initializeYurnalistLogger(): void {
  const activities: IYurnalistActivities = {}
  const yurnalist = createReporter({ emoji: true, verbose: true })

  const levelToYurnalist = {
    [LogLevels.Log]: yurnalist.log.bind(yurnalist),
    [LogLevels.Warning]: yurnalist.warn.bind(yurnalist),
    [LogLevels.Error]: yurnalist.error.bind(yurnalist),
    [LogLevels.Info]: yurnalist.info.bind(yurnalist),
    [LogLevels.Success]: yurnalist.success.bind(yurnalist),
    [LogLevels.Debug]: yurnalist.verbose.bind(yurnalist),
    [ActivityLogLevels.Success]: yurnalist.success.bind(yurnalist),
    [ActivityLogLevels.Failed]: (text: string): void => {
      yurnalist.log(`${chalk.red(`failed`)} ${text}`)
    },
    [ActivityLogLevels.Interrupted]: (text: string): void => {
      yurnalist.log(`${chalk.gray(`not finished`)} ${text}`)
    },
  }

  onLogAction(action => {
    switch (action.type) {
      case Actions.Log: {
        const yurnalistMethod = levelToYurnalist[action.payload.level]
        if (!yurnalistMethod) {
          process.stdout.write(`NO "${action.payload.level}" method\n`)
        } else {
          let message = action.payload.text
          if (action.payload.duration) {
            message += ` - ${action.payload.duration.toFixed(3)}s`
          }
          if (action.payload.statusText) {
            message += ` - ${action.payload.statusText}`
          }
          yurnalistMethod(message)
        }

        break
      }
      case Actions.StartActivity: {
        if (action.payload.type === ActivityTypes.Spinner) {
          const spinner = yurnalist.activity()
          spinner.tick(action.payload.text)

          const activity = {
            text: action.payload.text,
            statusText: action.payload.statusText,
            update(payload: any): void {
              // TODO: I'm not convinced that this is ever called with a text property.
              // From searching the codebase it appears that we do not ever assign a text
              // property during the IUpdateActivity action.
              if (payload.text) {
                activity.text = payload.text
              }
              if (payload.statusText) {
                activity.statusText = payload.statusText
              }

              let message = activity.text
              if (activity.statusText) {
                message += ` - ${activity.statusText}`
              }

              message += ` id:"${action.payload.id}"`

              spinner.tick(message)
            },
            end(): void {
              spinner.end()
            },
          }
          activities[action.payload.id] = activity
        } else if (action.payload.type === ActivityTypes.Progress) {
          const bar = new ProgressBar(
            ` [:bar] :current/:total :elapsed s :rate /s :percent ${action.payload.text}`,
            {
              total: Math.max(action.payload.total || 1, 1) || 1, // Not zero. Otherwise you get 0/0 errors.
              // curr: action.payload.current, // see below
              width: 30,
              clear: true,
            }
          )

          // There is a bug in the `progress` package where the timer doesn't
          // start until the first tick and setting `curr` will cause the
          // time/eta to remain zero: https://github.com/visionmedia/node-progress/issues/81
          // This is a workaround although the eta will initially be wrong
          // until it settles, if starting at non-zero.
          if (
            typeof action.payload.current === `number` &&
            action.payload.current >= 0
          ) {
            bar.tick(action.payload.current)
          }

          activities[action.payload.id] = {
            text: undefined,
            statusText: undefined,
            update(payload): void {
              if (payload.total) {
                bar.total = payload.total
              }
              if (payload.current) {
                bar.curr = payload.current
              }

              bar.tick(0)
            },
            end(): void {},
          }
        }
        break
      }
      case Actions.UpdateActivity: {
        const activity = activities[action.payload.id]
        if (activity) {
          activity.update(action.payload)
        }
        break
      }
      case Actions.EndActivity: {
        const activity = activities[action.payload.id]
        if (activity) {
          activity.end()
          delete activities[action.payload.id]
        }
        break
      }

      case Actions.RenderPageTree: {
        generatePageTreeToConsole(yurnalist, action.payload)
        break
      }
    }
  })
}
