// Shared by verify.mjs and build.mjs: merges the hand-written spec with the harvested matrix into one feature list
// per component, and checks that the spec accounts for every matrix row it touches.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export async function loadUniverse() {
  const { components } = await import('./spec/index.mjs')
  const matrix = JSON.parse(fs.readFileSync(path.join(here, 'seed', 'antd-matrix.json'), 'utf8'))
  const byId = new Map(matrix.components.map((c) => [c.id, c]))
  const used = new Map() // "matrix.slug" -> [component ids]
  const dropped = []
  const problems = []
  const out = []
  for (const c of components) {
    const features = []
    const seen = new Set()
    const known = new Set()
    for (const seed of c.seed) {
      const m = byId.get(seed.matrix)
      if (!m) { problems.push(`${c.id}: unknown matrix component ${seed.matrix}`); continue }
      for (const slug of seed.only ?? []) if (!m.features.some((f) => f.slug === slug)) problems.push(`${c.id}: matrix ${m.id} has no feature ${slug}`)
      for (const f of m.features) {
        if (seed.only && !seed.only.includes(f.slug)) continue
        known.add(f.slug)
        if (c.drop.includes(f.slug)) { dropped.push({ component: c.id, matrix: `${m.id}.${f.slug}` }); continue }
        const id = seen.has(f.slug) ? `${m.id}-${f.slug}` : f.slug
        seen.add(id)
        const key = `${m.id}.${f.slug}`
        used.set(key, [...(used.get(key) ?? []), c.id])
        let arabic
        if (f.arabicEdge) {
          arabic = c.seedArabic[f.slug]
          if (!arabic) problems.push(`${c.id}: matrix row ${key} has an arabicEdge note but the spec gives no curated note (sa)`)
        } else if (c.seedArabic[f.slug]) arabic = c.seedArabic[f.slug]
        const asserted = new Set(c.seedAsserted[f.slug] ?? [])
        if (!f.arabicEdge && !c.notAntd.includes(f.slug)) asserted.add('antd')
        features.push({ id, name: { ar: f.nameAr, en: f.name }, priority: m.priority, probe: c.seedProbes[f.slug], asserted: [...asserted], arabic, origin: 'owner-matrix', matrix: key })
      }
    }
    for (const group of ['drop', 'notAntd']) for (const slug of c[group]) if (!known.has(slug)) problems.push(`${c.id}: ${group} names ${slug}, which is not a seeded feature`)
    for (const slug of [...Object.keys(c.seedProbes), ...Object.keys(c.seedAsserted), ...Object.keys(c.seedArabic)]) if (!known.has(slug)) problems.push(`${c.id}: sp/so/sa names ${slug}, which is not a seeded feature`)
    for (const f of c.own) {
      if (seen.has(f.id)) problems.push(`${c.id}: duplicate feature id ${f.id}`)
      seen.add(f.id)
      features.push({ ...f, origin: 'authored' })
    }
    out.push({ ...c, features })
  }
  const unused = []
  for (const m of matrix.components) for (const f of m.features) if (!used.has(`${m.id}.${f.slug}`)) unused.push(`${m.id}.${f.slug}`)
  return { components: out, matrix, used, dropped, unused, problems }
}
