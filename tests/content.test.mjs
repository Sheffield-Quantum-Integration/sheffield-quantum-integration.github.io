import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getRecruitmentState, isOpportunityOpen, nextRecruitmentChange } from '../src/site/recruitment.js'
import { formatNewsDate, getInitials, newsDateTime, sortNews, sortPublications } from '../src/site/content.js'

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))
const site = readJson('public/data/site-content.json')
const fallback = readJson('src/data/content-fallback.json')
const news = readJson('public/data/news.json')
const publications = readJson('public/data/publications.json')

const DEADLINE = Date.parse('2027-01-13T17:00:00Z')
const phd = site.opportunitiesPage.items.find((item) => item.id === 'dla-2027-photonics-quantum-sensors')

test('primary and fallback content are semantically identical', () => {
  assert.deepEqual(fallback, site)
})

test('PhD opportunity is open before the deadline and closed at and after it', () => {
  assert.equal(phd.deadlineAt, '2027-01-13T17:00:00Z')
  assert.equal(isOpportunityOpen(phd, Date.parse('2026-10-21T12:00:00Z')), true)
  assert.equal(isOpportunityOpen(phd, DEADLINE - 1), true)
  assert.equal(isOpportunityOpen(phd, DEADLINE), false)
  assert.equal(isOpportunityOpen(phd, DEADLINE + 1), false)
  assert.equal(isOpportunityOpen(phd, Date.parse('2027-06-01T00:00:00Z')), false)
})

test('deadline instant does not depend on the local time zone', () => {
  // 13 Jan 2027 09:00 in Los Angeles (UTC-8) is 17:00 UTC: closed.
  assert.equal(isOpportunityOpen(phd, Date.parse('2027-01-13T09:00:00-08:00')), false)
  assert.equal(isOpportunityOpen(phd, Date.parse('2027-01-13T08:59:59-08:00')), true)
  // 14 Jan 2027 01:59 in Singapore (UTC+8) is 17:59 UTC on the 13th: closed.
  assert.equal(isOpportunityOpen(phd, Date.parse('2027-01-14T01:59:00+08:00')), false)
})

test('recruitment state and next change are shared from one calculation', () => {
  const before = getRecruitmentState(site.opportunitiesPage, DEADLINE - 1000)
  assert.equal(before.isRecruiting, true)
  assert.equal(before.isOpen(phd.id), true)
  assert.equal(nextRecruitmentChange(site.opportunitiesPage, DEADLINE - 1000), DEADLINE)

  const after = getRecruitmentState(site.opportunitiesPage, DEADLINE)
  assert.equal(after.isRecruiting, false)
  assert.equal(after.closedItems.length, 1)
  assert.equal(nextRecruitmentChange(site.opportunitiesPage, DEADLINE), null)
})

test('malformed or missing deadlines are handled conservatively', () => {
  assert.equal(isOpportunityOpen({ deadlineAt: 'not a date' }), false)
  assert.equal(isOpportunityOpen({ status: 'closed' }), false)
  assert.equal(isOpportunityOpen({}), true)
  assert.equal(isOpportunityOpen(null), false)
})

test('initials ignore honorifics', () => {
  assert.equal(getInitials('Dr Teymour Talha-Dean'), 'TT')
  assert.equal(getInitials('Dr. Joe A. Smith'), 'JA')
  assert.equal(getInitials('Prof. Jane Doe'), 'JD')
  assert.equal(getInitials('Prof Jane Doe'), 'JD')
  assert.equal(getInitials('Anatoliy Antill'), 'AA')
  assert.equal(getInitials('Drew Barrymore'), 'DB')
})

test('roster: PI, exactly four core members, three collaborators, alumni preserved', () => {
  const people = site.peoplePage
  assert.equal(people.pi.name, 'Dr Joe A. Smith')
  assert.equal(people.pi.socials.twitter, undefined)
  assert.deepEqual(
    people.members.map((m) => [m.name, m.role, m.group]),
    [
      ['Dr Maxim Makhonin', 'Postdoctoral Researcher', 'Postdocs'],
      ['Dr Teymour Talha-Dean', 'Postdoctoral Researcher', 'Postdocs'],
      ['Anatoliy Antill', 'PhD Student', 'PhD Students'],
      ['Jack Wall', 'PhD Student', 'PhD Students']
    ]
  )
  assert.equal(people.members.find((m) => m.name === 'Dr Teymour Talha-Dean').photo, undefined)
  assert.equal(people.members.find((m) => m.name === 'Jack Wall').note, 'with Matthew Hobbs')
  assert.deepEqual(
    people.collaborators.map((c) => [c.name, c.affiliation]),
    [
      ['Hao-Cheng Weng', 'University of Bristol'],
      ['Kimy Jaimes', 'University of New Brunswick'],
      ['Dr Agnethe Seim Olsen', 'RobQuant Ltd']
    ]
  )
  assert.deepEqual(
    people.alumni.map((a) => a.name),
    ['Hazem Zied', 'Sophia Komrakova', 'Angela Stephen', 'Molly Thomas', 'Vivek Tiwari']
  )
  const everywhere = JSON.stringify(site)
  assert.equal(everywhere.match(/Hazem Zied/g).length, 1)
  assert.ok(!/Yuxuan|Lai\b/.test(everywhere))
})

test('research page has the four agreed themes with stable ids', () => {
  const sections = site.researchPage.sections
  assert.deepEqual(
    sections.map((s) => [s.id, s.icon]),
    [
      ['photonic-nv-sensor-arrays', 'zap'],
      ['cavity-enhanced-diamond-sensors', 'atom'],
      ['scalable-control-and-readout', 'cpu'],
      ['robotic-vector-field-alignment', 'bot']
    ]
  )
  assert.equal(sections[2].image, undefined)
  for (const section of sections) {
    if (section.image) assert.ok(section.image.alt && section.image.caption && section.image.width && section.image.height, section.id)
  }
  assert.ok(sections[0].body.endsWith('in an ARIA-funded seed project with the Bates Lab.'))
})

const NON_COPY_KEYS = new Set(['src', 'srcSet', 'sizes', 'url', 'applyUrl', 'secondaryUrl', 'photo', 'thumbnail', 'logo', 'logoUrl', 'image', 'linkedin', 'orcid', 'staffProfile', 'deadlineAt', 'id', 'opportunityId', 'target', 'icon', 'direction'])
const visibleText = (value, key = '') => {
  if (NON_COPY_KEYS.has(key) && typeof value === 'string') return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap((entry) => visibleText(entry))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => visibleText(v, k))
  return []
}

test('public copy follows the scientific guardrails', () => {
  const text = [...visibleText(site), ...visibleText(news)].join('\n')
  assert.ok(!/two pixels|two-pixel|2 pixels/i.test(text), 'two pixels line')
  assert.ok(!/world.?s first|first ever|world-leading|order of magnitude/i.test(text), 'superlatives')
  assert.ok(!/\d+(\.\d+)?\s*[×x]\b/.test(text.replace(/5× magnification/g, '')), 'enhancement factors')
  assert.ok(!/£1\.25M|1,246,923|£1,246/.test(text), 'alternate fellowship figure')
  assert.ok(!/Electronic and Electrical Engineering/.test(text), 'old school name')
  assert.ok(!/"twitter"\s*:/.test(text), 'dead twitter links')
  assert.ok(!/stipend[^.]*£/.test(text), 'unlabelled stipend amount')
  for (const match of text.matchAll(/£[\d.,]+M?/g)) assert.equal(match[0], '£1.6M')
  for (const sentence of text.split(/(?<=[.!?])\s+|\n/)) {
    if (/\b64\b/.test(sentence)) {
      assert.match(sentence, /aim|target|towards|goal/i, `64 must read as an aim: ${sentence}`)
    }
  }
  for (const entry of [...visibleText(site), ...visibleText(news)].filter((value) => /ARIA/.test(value))) {
    assert.ok(!/£|\$|€|milestone/i.test(entry), `ARIA amounts or milestones: ${entry}`)
  }
})

test('Bristol is credited for both joint results', () => {
  const theme1 = site.researchPage.sections[0].body
  const theme3 = site.researchPage.sections[2].body
  assert.match(theme1, /University of Bristol[^.]*eight-sensor/)
  assert.match(theme3, /University of Bristol[^.]*Physical Review Applied/)
  assert.match(site.home.headlineResult.text, /University of Bristol/)
})

test('removed dead data stays removed', () => {
  assert.equal(site.hero.badge, undefined)
  assert.equal(site.stats, undefined)
  assert.equal(site.pillars, undefined)
  assert.equal(site.contactPage.email, undefined)
})

test('news: newest first, no duplicates, count matches, month-only date', () => {
  const ids = news.items.map((item) => item.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(new Set(news.items.map((item) => item.title)).size, ids.length)
  assert.equal(news.count, news.items.length)
  assert.deepEqual(sortNews(news.items).map((item) => item.id), ids)
  const aria = news.items.find((item) => item.id === 'aria-seed-magnetobiotics-2026')
  assert.equal(aria.date, '2026-06')
  assert.equal(formatNewsDate(aria), 'June 2026')
  assert.equal(newsDateTime(aria), '2026-06')
  assert.equal(formatNewsDate({ date: '2026-10-19' }), '19 October 2026')
  assert.equal(newsDateTime({ date: '2026-10-19' }), '2026-10-19')
  assert.ok(news.items.some((item) => item.id === 'quantum-dot-day-2026'))
})

test('publications keep their entries, corrected arXiv link and newest-first teaser order', () => {
  assert.equal(publications.items.length, 8)
  const hetero = publications.items.find((p) => p.title.startsWith('Heterogeneous integration'))
  assert.equal(hetero.links.find((l) => l.label === 'arXiv').url, 'https://arxiv.org/abs/2304.10227')
  const natcomm = publications.items.find((p) => p.title.startsWith('Photonic-integrated quantum sensor array'))
  assert.equal(natcomm.venue, 'Nature Communications 17, 6185 (2026)')
  assert.deepEqual(
    sortPublications(publications.items).slice(0, 3).map((p) => p.venue),
    ['Physical Review Applied 25.2 (2026): 024025', 'Nature Communications 17, 6185 (2026)', 'Advanced Science 11.2 (2024): 2304449']
  )
})
