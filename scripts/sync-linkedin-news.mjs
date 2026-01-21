import { writeFileSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DEFAULT_OUTPUT_PATH = resolve(__dirname, '../public/data/news.json')
const LINKEDIN_PROFILE_URL = 'https://www.linkedin.com/in/joesmio/'

function parseArgs(argv) {
  const out = { 
    output: DEFAULT_OUTPUT_PATH,
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
    personUrn: process.env.LINKEDIN_PERSON_URN,
    manual: false
  }
  
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--out') {
      out.output = resolve(argv[i + 1] ?? out.output)
      i += 1
      continue
    }
    if (arg === '--token') {
      out.accessToken = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--urn') {
      out.personUrn = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--manual') {
      out.manual = true
      continue
    }
  }
  return out
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateId(title, date) {
  const dateStr = date ? new Date(date).toISOString().split('T')[0] : ''
  const slug = slugify(title)
  return dateStr ? `${dateStr}-${slug}` : slug
}

/**
 * Fetch posts from LinkedIn API using UGC Posts API
 * Requires r_member_social permission
 */
async function fetchLinkedInPosts(accessToken, personUrn) {
  if (!accessToken || !personUrn) {
    throw new Error('LinkedIn access token and person URN are required for API sync')
  }

  const url = `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${encodeURIComponent(personUrn)})&sortBy=CREATED&count=10`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}\n${errorText}`)
  }

  const data = await response.json()
  
  // Transform LinkedIn UGC posts to our news format
  const items = (data.elements || []).map((post) => {
    const content = post.specificContent?.['com.linkedin.ugc.ShareContent']?.text?.text || ''
    const created = post.created?.time || new Date().toISOString()
    const postUrn = post.id || ''
    
    // Extract LinkedIn post URL (approximate)
    const linkedinUrl = postUrn 
      ? `https://www.linkedin.com/feed/update/${postUrn.split(':').pop()}`
      : LINKEDIN_PROFILE_URL

    return {
      id: generateId(content.substring(0, 50) || 'Untitled', created),
      title: content.substring(0, 100) || 'LinkedIn Post',
      content: content,
      date: created,
      linkedinUrl: linkedinUrl,
      tags: ['LinkedIn']
    }
  })

  return items
}

/**
 * Manual entry helper - prompts user to add news items
 */
async function manualEntry() {
  console.log('\n=== Manual News Entry ===')
  console.log('Enter news items manually. Press Ctrl+C when done.\n')
  
  const items = []
  const readline = await import('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve))

  try {
    while (true) {
      console.log(`\n--- News Item ${items.length + 1} ---`)
      
      const title = await question('Title: ')
      if (!title.trim()) break

      const date = await question('Date (YYYY-MM-DD) [today]: ') || new Date().toISOString().split('T')[0]
      const content = await question('Content (press Enter twice when done):\n')
      const linkedinUrl = await question('LinkedIn URL (optional): ')
      const tagsInput = await question('Tags (comma-separated, optional): ')
      
      const tags = tagsInput.trim() 
        ? tagsInput.split(',').map(t => t.trim()).filter(Boolean)
        : []

      items.push({
        id: generateId(title, date),
        title: title.trim(),
        content: content.trim() || undefined,
        date: date,
        linkedinUrl: linkedinUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined
      })
    }
  } finally {
    rl.close()
  }

  return items
}

async function main() {
  const { output, accessToken, personUrn, manual } = parseArgs(process.argv.slice(2))

  let items = []
  let source = 'manual'

  try {
    if (manual) {
      items = await manualEntry()
      source = 'manual'
    } else if (accessToken && personUrn) {
      console.log('Fetching posts from LinkedIn API...')
      items = await fetchLinkedInPosts(accessToken, personUrn)
      source = 'linkedin-api'
      console.log(`Fetched ${items.length} posts from LinkedIn`)
    } else {
      console.error('Error: LinkedIn API credentials not provided.')
      console.error('\nOptions:')
      console.error('1. Use LinkedIn API:')
      console.error('   Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN environment variables')
      console.error('   Or use --token and --urn flags')
      console.error('   Note: Requires r_member_social permission (restricted)')
      console.error('\n2. Manual entry:')
      console.error('   Run with --manual flag')
      console.error('\n3. For more info, see: https://learn.microsoft.com/en-us/linkedin/compliance/integrations/shares/ugc-post-api')
      process.exit(1)
    }

    // Load existing items to merge (optional - you might want to replace instead)
    let existingItems = []
    if (existsSync(output)) {
      try {
        const existing = JSON.parse(readFileSync(output, 'utf8'))
        existingItems = existing.items || []
      } catch (err) {
        console.warn('Could not read existing news.json, starting fresh')
      }
    }

    // Merge new items with existing (deduplicate by id)
    const existingIds = new Set(existingItems.map(item => item.id))
    const newItems = items.filter(item => !existingIds.has(item.id))
    const allItems = [...newItems, ...existingItems].sort((a, b) => {
      // Sort by date, newest first
      const dateA = new Date(a.date || 0)
      const dateB = new Date(b.date || 0)
      return dateB - dateA
    })

    const payload = {
      source: source,
      lastSyncedAt: new Date().toISOString(),
      count: allItems.length,
      items: allItems
    }

    writeFileSync(output, JSON.stringify(payload, null, 2) + '\n', 'utf8')
    console.log(`\n✓ Wrote ${allItems.length} news items to ${output}`)
    if (newItems.length > 0) {
      console.log(`  (${newItems.length} new items added)`)
    }
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()
