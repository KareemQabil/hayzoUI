import { lazy, Suspense, useEffect } from 'react'
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
// The state matrix is a review tool: loaded on demand with its renderers and specs.
const MatrixPage = lazy(() => import('./pages/MatrixPage').then((m) => ({ default: m.MatrixPage })))
// The atomic first proof: loaded on demand with the token engine and the atomic slice.
const ProofPage = lazy(() => import('./pages/ProofPage').then((m) => ({ default: m.ProofPage })))
const ParityPage = lazy(() => import('./pages/ParityPage').then((m) => ({ default: m.ParityPage })))
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((m) => ({ default: m.ProgressPage })))

function Routes() {
  const route = useRoute()
  const [section = 'progress'] = route
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [section, route[1]])
  let page
  switch (section) {
    case 'progress':
      page = <Suspense fallback={<p className="p-8 text-fg-2">جارٍ تحميل مختبر التقدم…</p>}><ProgressPage /></Suspense>
      break
    case 'proof':
      page = <Suspense fallback={<p className="p-8 text-fg-2">جارٍ تحميل الإثبات…</p>}><ProofPage /></Suspense>
      break
    case 'parity':
      page = <Suspense fallback={<p className="p-8 text-fg-2">جارٍ تحميل مصفوفة التكافؤ…</p>}><ParityPage /></Suspense>
      break
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
      page = (
        <Suspense fallback={<p className="t-caption text-fg-2">جارٍ تحميل المصفوفة…</p>}>
          <MatrixPage id={route[1]} />
        </Suspense>
      )
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
    document.title = 'HayzoUI — مختبر التقدم والواجهات العربية'
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
