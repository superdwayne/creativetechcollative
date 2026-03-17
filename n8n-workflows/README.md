# CTC n8n Workflows

Automated content workflows for the Creative Technology Collective.

---

## Viral Post Generator (`ctc-viral-post-generator.json`)

Generate scroll-stopping viral content for LinkedIn and Instagram on demand.

### What It Generates

**LinkedIn (3 variations using proven viral formulas):**
- **Controversial Hot Take** - Bold statements that spark debate
- **Story-Driven Transformation** - Personal journey with lessons
- **Counterintuitive Insight** - Surprising truths that challenge assumptions

**Instagram (3 variations in different formats):**
- **Carousel** - 10-slide value-packed posts
- **Single Image + Story Caption** - Authentic, relatable content
- **Reel Concept** - Full script with hooks and trending audio suggestions

### Viral Mechanics Built-In
- Scroll-stopping hooks in first line
- Mobile-optimized formatting (short paragraphs, line breaks)
- Specific numbers and details (not "many" but "847")
- Emotional triggers (curiosity, aspiration, "I feel seen")
- Hashtag strategy (first comment for LinkedIn, end of caption for IG)
- Best posting times included

### Workflow Flow
```
[Manual Trigger] ──┬──> [LinkedIn Viral Generator]──┐
                   │                                 ├──> [Merge] ──> [Parse] ──┬──> [LinkedIn Sheet]
                   └──> [Instagram Viral Generator]─┘                          └──> [Instagram Sheet]
```

---

## Content Generation (`ctc-content-generation.json`)

Scheduled weekly content generation for social and newsletter.

### What It Does

- Runs weekly (Monday 9 AM)
- Generates LinkedIn and Twitter/X posts
- Creates newsletter draft content
- Saves everything to Google Sheets for team review

---

## Quick Start (Viral Post Generator)

### 1. Import & Configure
```
1. Import ctc-viral-post-generator.json into n8n
2. Add Anthropic API credential (Header Auth with x-api-key)
3. Add Google Sheets OAuth2 credential
4. Set GOOGLE_SHEET_ID environment variable
```

### 2. Create Google Sheets

**Sheet: "LinkedIn Viral"**
| Date | Variation | Formula | Hook | Full Post | Hashtags (1st Comment) | Why It Will Go Viral | Best Time to Post | Status |

**Sheet: "Instagram Viral"**
| Date | Variation | Format | Hook | Visual Concept | Caption | Hashtags | Why It Will Go Viral | Content Pillar | Status |

### 3. Run It
Click "Test workflow" → Get 6 viral post options (3 LinkedIn + 3 Instagram)

---

## Full Setup Instructions

### 1. Import the Workflow

1. Open your n8n instance
2. Go to **Workflows** > **Import from File**
3. Select `ctc-content-generation.json`

### 2. Configure Credentials

#### Anthropic API Key
1. Go to **Settings** > **Credentials** > **Add Credential**
2. Choose **Header Auth**
3. Name: `Anthropic API Key`
4. Header Name: `x-api-key`
5. Header Value: Your Anthropic API key

#### Google Sheets OAuth2
1. Go to **Settings** > **Credentials** > **Add Credential**
2. Choose **Google Sheets OAuth2 API**
3. Follow OAuth flow to connect your Google account

### 3. Set Up Google Sheet

Create a Google Sheet with these columns:

| Date | Platform | Type | Subject | Content | Status |
|------|----------|------|---------|---------|--------|
| 2024-01-15 | LinkedIn | Social Media | | [content] | Draft |
| 2024-01-15 | Twitter/X | Social Media | | [content] | Draft |
| 2024-01-15 | Newsletter | Newsletter | Subject Line | [content] | Draft |

### 4. Configure Environment Variable

Set `GOOGLE_SHEET_ID` in n8n:
1. Go to **Settings** > **Variables**
2. Add: `GOOGLE_SHEET_ID` = your sheet ID (from the URL)

### 5. Activate the Workflow

Toggle the workflow to **Active** to enable the weekly schedule.

## Workflow Structure

```
[Weekly Schedule]
       |
       +---> [Generate Social Media Content] --+
       |                                        |
       +---> [Generate Newsletter Content] ----+
                                               |
                                               v
                                    [Parse & Format Content]
                                               |
                                               v
                                    [Save to Google Sheets]
                                               |
                                               v
                                    [Execution Summary]
```

## Customization

### Change Schedule
Edit the "Weekly Schedule" node to adjust timing:
- Daily, weekly, or monthly options
- Specific days and times

### Modify Content Types
Edit the prompts in the HTTP Request nodes to generate different content:
- Add Instagram captions
- Create blog post outlines
- Generate event announcements

### Add Direct Posting
Extend the workflow with platform-specific nodes:
- LinkedIn node for direct posting
- Twitter node for tweets
- Mailchimp/Sendgrid for newsletters
