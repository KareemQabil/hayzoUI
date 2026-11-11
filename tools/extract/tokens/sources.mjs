// Pinned upstream artifacts for the token-reference layer. One entry per npm package (or git repository).
// `fetch.mjs` downloads each into its own directory; the per-system extractors read them as text only.
export const RETRIEVED_AT = '2026-11-11'

export const PACKAGES = [
  // Ant Design
  { name: 'antd', version: '6.7.0' },
  { name: '@ant-design/colors', version: '8.0.1' },
  // Material Design 3
  { name: '@material/web', version: '2.5.0' },
  { name: '@material/material-color-utilities', version: '0.4.0' },
  { name: '@material/density', version: '14.0.0' },
  { name: '@material/button', version: '14.0.0' },
  { name: '@material/textfield', version: '14.0.0' },
  { name: '@angular/material', version: '22.2.6' },
  // MUI
  { name: '@mui/material', version: '9.5.0' },
  { name: '@mui/system', version: '9.5.0' },
  // Radix
  { name: '@radix-ui/colors', version: '3.0.0' },
  { name: '@radix-ui/themes', version: '3.3.0' },
  // Tailwind CSS
  { name: 'tailwindcss', version: '4.3.5' },
  // Open Props
  { name: 'open-props', version: '1.7.23' },
  // IBM Carbon
  { name: '@carbon/themes', version: '11.85.0' },
  { name: '@carbon/layout', version: '11.63.0' },
  { name: '@carbon/type', version: '11.71.0' },
  { name: '@carbon/motion', version: '11.56.0' },
  { name: '@carbon/colors', version: '11.62.0' },
  { name: '@carbon/styles', version: '1.119.0' },
  { name: '@carbon/grid', version: '11.66.0' },
  // Microsoft Fluent
  { name: '@fluentui/tokens', version: '1.0.0-alpha.24' },
  { name: '@fluentui/theme', version: '2.7.4' },
  { name: '@fluentui/react-input', version: '9.8.9' },
  { name: '@fluentui/react-button', version: '9.11.3' },
  // GitHub Primer
  { name: '@primer/primitives', version: '11.10.0' },
  // Adobe Spectrum
  { name: '@adobe/spectrum-tokens', version: '15.6.0' },
  // Shopify Polaris
  { name: '@shopify/polaris-tokens', version: '9.4.2' },
  { name: '@shopify/polaris', version: '13.9.5' },
  // Mantine
  { name: '@mantine/core', version: '9.8.0' },
  // Chakra UI
  { name: '@chakra-ui/react', version: '3.38.0' },
]

// shadcn/ui publishes its default theme in its repository, not in an npm package.
export const REPOS = [{ name: 'shadcn-ui/ui', url: 'https://github.com/shadcn-ui/ui.git', dir: 'git/shadcn-ui' }]

/** Directory of an unpacked package inside the scratch root: pkg/<name with / replaced by __>@<version>/package */
export function pkgDir(root, name) {
  const p = PACKAGES.find((x) => x.name === name)
  if (!p) throw new Error(`package not pinned in sources.mjs: ${name}`)
  return `${root}/pkg/${name.replace('/', '__')}@${p.version}/package`
}
export function pkgVersion(name) {
  return PACKAGES.find((x) => x.name === name).version
}
