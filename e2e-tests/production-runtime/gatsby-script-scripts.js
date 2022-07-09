export const script = {
  three: `three`,
  marked: `marked`,
  jQuery: `jQuery`,
  popper: `popper`,
}

export const scripts = {
  [script.three]: `https://unpkg.com/three@0.139.1/build/three.js`,
  [script.marked]: `https://cdn.jsdelivr.net/npm/marked/marked.min.js`,
  [script.jQuery]: `https://code.jquery.com/jquery-3.4.1.min.js`,
  [script.popper]: `https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js`,
}

export const scriptStrategyIndex = {
  [script.three]: `post-hydrate`,
  [script.marked]: `idle`,
  [script.jQuery]: `post-hydrate`,
  [script.popper]: `idle`,
}

export const scriptSuccessIndex = {
  // @ts-ignore
  [script.three]: () => typeof THREE === `object`,
  // @ts-ignore
  [script.marked]: () => typeof marked === `object`,
  // @ts-ignore
  [script.jQuery]: () => typeof jQuery === `function`,
  // @ts-ignore
  [script.popper]: () => typeof Popper === `function`,
}

export const scriptUrlIndex = {
  [scripts.three]: script.three,
  [scripts.marked]: script.marked,
  [scripts.jQuery]: script.jQuery,
  [scripts.popper]: script.popper,
}

export const scriptUrls = new Set(Object.values(scripts))

export const inlineScript = {
  dangerouslySet: `dangerously-set`,
  templateLiteral: `template-literal`,
}

// Create an object literal instead of iterating so the contents are explicit
export const inlineScripts = {
  "dangerously-set": {
    "post-hydrate": constructInlineScript(`dangerously-set`, `post-hydrate`),
    idle: constructInlineScript(`dangerously-set`, `idle`),
  },
  "template-literal": {
    "post-hydrate": constructInlineScript(`template-literal`, `post-hydrate`),
    idle: constructInlineScript(`template-literal`, `idle`),
  },
}

function constructInlineScript(type, strategy) {
  return `
    performance.mark(\`inline-script\`, { detail: {
      strategy: \`${strategy}\`,
      type: \`${type}\`,
      executeStart: performance.now()
    }})
    window[\`${strategy}-${type}\`] = true;
  `
}
