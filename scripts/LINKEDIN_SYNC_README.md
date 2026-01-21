# LinkedIn News Sync

This script helps sync your LinkedIn posts to the News & Events page on your website.

## Options

### Option 1: LinkedIn API (Requires API Access)

LinkedIn's API requires the `r_member_social` permission, which is currently **restricted/closed** and difficult to obtain. If you have this permission:

1. Get your LinkedIn Person URN (format: `urn:li:person:XXXXXX`)
2. Get an OAuth access token with `r_member_social` scope
3. Run:

```bash
LINKEDIN_ACCESS_TOKEN=your_token LINKEDIN_PERSON_URN=urn:li:person:XXXXXX npm run sync:news
```

Or with flags:
```bash
npm run sync:news -- --token your_token --urn urn:li:person:XXXXXX
```

**Note:** Getting `r_member_social` permission typically requires:
- A LinkedIn Developer account
- A valid use case application
- Approval from LinkedIn (often rejected for personal use cases)

### Option 2: Manual Entry (Recommended)

Since LinkedIn API access is restricted, the easiest approach is manual entry:

```bash
npm run sync:news:manual
```

This will prompt you to enter:
- Title
- Date (defaults to today)
- Content
- LinkedIn URL (optional)
- Tags (optional)

Press Ctrl+C when you're done adding items.

### Option 3: Direct JSON Editing

You can also directly edit `public/data/news.json`:

```json
{
  "source": "manual",
  "lastSyncedAt": "2025-01-21T12:00:00.000Z",
  "count": 1,
  "items": [
    {
      "id": "2025-01-21-example-post",
      "title": "Example Post Title",
      "content": "Post content here...",
      "date": "2025-01-21T12:00:00.000Z",
      "linkedinUrl": "https://www.linkedin.com/posts/...",
      "tags": ["News", "Research"]
    }
  ]
}
```

## Getting LinkedIn API Access (If You Want to Try)

1. **Create a LinkedIn App:**
   - Go to https://www.linkedin.com/developers/apps
   - Create a new app
   - Note your Client ID and Client Secret

2. **Request Permissions:**
   - In your app settings, request `r_member_social` permission
   - Provide a use case (e.g., "Displaying my own posts on my lab website")
   - **Warning:** This permission is often rejected for personal use cases

3. **OAuth Flow:**
   - Implement OAuth 2.0 3-legged flow
   - Get access token with `r_member_social` scope
   - Get your Person URN from the API

4. **Alternative:** Consider using a service like Zapier or Make.com to automate syncing LinkedIn posts to your website.

## Tips

- The script merges new items with existing ones (deduplicates by ID)
- Items are sorted by date (newest first)
- You can mix API-synced and manually-added items
- The news page will automatically display items from `public/data/news.json`
