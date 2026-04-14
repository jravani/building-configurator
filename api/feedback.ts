// Vercel serverless function — receives feedback from the in-app widget,
// uploads screenshots directly to the GitHub issue as assets, and creates
// a GitHub issue with the screenshots embedded in the body.
//
// Required environment variables (set in Vercel project settings):
//   GITHUB_TOKEN  — Personal Access Token with `repo` scope OR fine-grained
//                   token with Issues: Read and write
//   GITHUB_OWNER  — repository owner (e.g. "your-org")
//   GITHUB_REPO   — repository name (e.g. "building-configurator")

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ScreenshotPayload {
  name:     string;   // original filename
  data:     string;   // base64-encoded image content (no data-URI prefix)
  mimeType: string;   // image/png | image/jpeg | image/webp
}

interface FeedbackPayload {
  goal:         string;
  result:       string;
  rating:       number;
  view:         string;
  context:      string;
  url:          string;
  timestamp:    string;
  screenshots:  ScreenshotPayload[];
}

function ratingMeta(r: number): { label: string; ghLabel: string } {
  if (r <= 2) return { label: `${r} – Easy`,        ghLabel: 'feedback: easy'    };
  if (r === 3) return { label: '3 – Moderate',       ghLabel: 'feedback: moderate'};
  if (r === 4) return { label: '4 – Difficult',      ghLabel: 'feedback: hard'    };
               return { label: '5 – Blocked/broken', ghLabel: 'feedback: blocked' };
}

/** Uploads a base64-encoded image as an asset attached to an existing issue.
 *  Uses uploads.github.com which only requires Issues: write permission.
 *  Returns a GitHub CDN URL (github.com/user-attachments/assets/...) that
 *  renders correctly in GitHub markdown regardless of repo visibility. */
async function uploadIssueAsset(
  owner:       string,
  repo:        string,
  issueNumber: number,
  token:       string,
  shot:        ScreenshotPayload,
): Promise<string> {
  const binary   = Buffer.from(shot.data, 'base64');
  const safeName = shot.name.replace(/[^a-zA-Z0-9._-]/g, '_');

  const res = await fetch(
    `https://uploads.github.com/repos/${owner}/${repo}/issues/${issueNumber}/assets?name=${encodeURIComponent(safeName)}`,
    {
      method:  'POST',
      headers: {
        Authorization:          `Bearer ${token}`,
        Accept:                 'application/vnd.github+json',
        'Content-Type':         shot.mimeType || 'image/png',
        'Content-Length':       String(binary.length),
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: binary,
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asset upload failed (HTTP ${res.status}): ${err}`);
  }

  const json = await res.json() as { url: string };
  return json.url;
}

function buildIssueBody(p: FeedbackPayload, screenshotUrls: string[]): string {
  const { label } = ratingMeta(p.rating);
  const lines = [
    '## User Feedback',
    '',
    '| Field | Value |',
    '|---|---|',
    `| **Screen** | ${p.view} |`,
    `| **Context** | ${p.context || '—'} |`,
    `| **Difficulty** | ${label} |`,
    `| **Submitted** | ${p.timestamp} |`,
    `| **URL** | ${p.url} |`,
    '',
    '---',
    '',
    '### What were you trying to do?',
    p.goal,
    '',
    '### What happened / what did you expect?',
    p.result,
  ];

  if (screenshotUrls.length > 0) {
    lines.push('', `### Screenshots (${screenshotUrls.length})`);
    screenshotUrls.forEach((url, i) => {
      lines.push('', `**Screenshot ${i + 1}**`, `![Screenshot ${i + 1}](${url})`);
    });
  }

  lines.push(
    '',
    '---',
    '*Auto-generated from the in-app feedback widget.*',
    '*A GitHub Copilot agent can use the screenshot and context above to refine this into a concrete implementation issue.*',
  );

  return lines.join('\n');
}

function buildIssueTitle(p: FeedbackPayload): string {
  const prefix = '[Feedback] ';
  const max    = 72 - prefix.length;
  const goal   = p.goal.replace(/\n/g, ' ').trim();
  return `${prefix}${goal.length > max ? goal.slice(0, max - 1) + '…' : goal}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.error('Missing GitHub env vars');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const payload = req.body as FeedbackPayload;
  if (!payload?.goal?.trim() || !payload?.result?.trim()) {
    return res.status(400).json({ error: 'goal and result are required' });
  }

  const { ghLabel } = ratingMeta(payload.rating ?? 3);

  // ── Step 1: Create the issue (without screenshots — we don't have URLs yet) ──
  const ghRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization:          `Bearer ${GITHUB_TOKEN}`,
        Accept:                 'application/vnd.github+json',
        'Content-Type':         'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title:  buildIssueTitle(payload),
        body:   buildIssueBody(payload, []),
        labels: ['user-feedback', 'ux', ghLabel],
      }),
    },
  );

  if (!ghRes.ok) {
    const err = await ghRes.text();
    console.error('GitHub Issues API error:', err);
    return res.status(502).json({ error: 'Failed to create issue' });
  }

  const issue = await ghRes.json() as { number: number; html_url: string };

  // ── Step 2: Upload screenshots as issue assets ────────────────────────────
  const screenshotUrls: string[] = [];
  for (const shot of payload.screenshots ?? []) {
    if (!shot?.data) continue;
    try {
      const url = await uploadIssueAsset(GITHUB_OWNER, GITHUB_REPO, issue.number, GITHUB_TOKEN, shot);
      screenshotUrls.push(url);
    } catch (e) {
      // Non-fatal: log the error but continue — the issue already exists
      console.error(`Screenshot upload failed for issue #${issue.number}:`, e);
    }
  }

  // ── Step 3: Patch issue body to include screenshot URLs ───────────────────
  if (screenshotUrls.length > 0) {
    const patchRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issue.number}`,
      {
        method: 'PATCH',
        headers: {
          Authorization:          `Bearer ${GITHUB_TOKEN}`,
          Accept:                 'application/vnd.github+json',
          'Content-Type':         'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ body: buildIssueBody(payload, screenshotUrls) }),
      },
    );

    if (!patchRes.ok) {
      console.error('Failed to patch issue with screenshot URLs:', await patchRes.text());
      // Issue already created — still return success
    }
  }

  return res.status(201).json({ issueNumber: issue.number, issueUrl: issue.html_url });
}
