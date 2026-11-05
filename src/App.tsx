import { useEffect } from 'react'
import { Shell } from './app/Shell'
import { useRoute } from './app/router'
import { RootLocale, SettingsProvider, ToastProvider } from './system'
import { ComponentsPage } from './pages/components/ComponentsPage'
import { StudioPage } from './pages/StudioPage'
import { PatternsPage } from './pages/PatternsPage'
import { ReferenceApp } from './pages/reference/ReferenceApp'
import { EvidencePage } from './pages/EvidencePage'
import { ResourcesPage } from './pages/ResourcesPage'
import { RulesPage } from './pages/RulesPage'
import { EcosystemPage } from './pages/EcosystemPage'
import { MatrixPage } from './pages/MatrixPage'

function Routes() {
  const route = useRoute()
  const [section = 'components'] = route
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [section, route[1]])
  let page
  switch (section) {
    case 'studio':
      page = <StudioPage />
      break
    case 'patterns':
      page = <PatternsPage id={route[1]} />
      break
    case 'app':
      page = <ReferenceApp />
      break
    case 'evidence':
      page = <EvidencePage />
      break
    case 'resources':
      page = <ResourcesPage id={route[1]} />
      break
    case 'rules':
      page = <RulesPage id={route[1]} />
      break
    case 'matrix':
      page = <MatrixPage id={route[1]} />
      break
    case 'ecosystem':
      page = <EcosystemPage />
      break
    default:
      page = <ComponentsPage id={route[1] ?? 'currency-input'} tab={route[2]} />
  }
  return <Shell route={route}>{page}</Shell>
}

export default function App() {
  useEffect(() => {
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
    document.title = 'التجربة العربية — مرجع واجهات عربية أولًا'
  }, [])
  return (
    <SettingsProvider>
      <RootLocale>
        <ToastProvider>
          <Routes />
        </ToastProvider>
      </RootLocale>
    </SettingsProvider>
  )
}
