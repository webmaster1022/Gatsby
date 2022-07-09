import React, { ReactElement, useState } from "react"
import type { GatsbySSR } from "gatsby"
import { Partytown } from "@builder.io/partytown/react"
import { PartytownContext, ScriptProps } from "gatsby-script"

interface ICollectedForwardsState {
  collectedForwards: Set<string>
  collectedAnyScript: boolean
}

function PartytownProvider({ children }): ReactElement {
  const [{ collectedForwards, collectedAnyScript }, setState] =
    useState<ICollectedForwardsState>({
      collectedForwards: new Set(),
      collectedAnyScript: false,
    })

  return (
    <PartytownContext.Provider
      value={{
        collectScript: (newScript: ScriptProps): void => {
          let stateShouldChange = false
          const potentialNewState = {
            collectedAnyScript,
            collectedForwards,
          }

          if (!collectedAnyScript) {
            potentialNewState.collectedAnyScript = true
            stateShouldChange = true
          }

          if (newScript?.forward) {
            if (Array.isArray(newScript.forward)) {
              for (const singleForward of newScript.forward) {
                if (!potentialNewState.collectedForwards.has(singleForward)) {
                  potentialNewState.collectedForwards.add(singleForward)
                  stateShouldChange = true
                }
              }
            } else {
              if (process.env.NODE_ENV === `development`) {
                console.log(`unexpected shape of forward`, newScript)
              }
            }
          }

          if (stateShouldChange) {
            setState(potentialNewState)
          }
        },
      }}
    >
      {children}
      {collectedAnyScript && (
        <Partytown key="partytown" forward={Array.from(collectedForwards)} />
      )}
    </PartytownContext.Provider>
  )
}

export const wrapRootElement: GatsbySSR[`wrapRootElement`] = ({ element }) => (
  <PartytownProvider>{element}</PartytownProvider>
)
