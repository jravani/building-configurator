// Vercel serverless function — receives feedback from the in-app widget and
// creates a GitHub issue so every submission is immediately actionable.
//
// Required environment variables (set in Vercel project settings):
//   GITHUB_TOKEN  — Personal Access Token with `repo` scope
//   GITHUB_OWNER  — repository owner (e.g. "your-org")
//   GITHUB_REPO   — repository name (e.g. "building-configurator")

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface FeedbackPayload {
  /** What the user was trying to accomplish. */
  goal: string;
  /** What actually happened (or what they expected instead). */
  result: string;
  /** 1–5 difficulty rating (1 = very easy, 5 = very hard / blocked). */
  rating: number;
  /** Current workspace view at time of submission. */
  view: string;
  /** Free-form context string (e.g. "Configure › Walls › Wall 2"). */
  context: string;
  /** Full page URL. */
  url: string;
  /** ISO timestamp from the client. */
  timestamp: string;
}

/** Maps a 1–5 difficulty rating to a human-readable label and GitHub label. */
function ratingMeta(r: number): { label: string; ghLabel: string } {
  if (r <= 1) return { label: '1 – Very easy',        ghLabel: 'feedback: easy'    };
  if (r <= 2) return { label: '2 – Easy',              ghLabel: 'feedback: easy'    };
  if (r <= 3) return { label: '3 – Moderate',          ghLabel: 'feedback: moderate'};
  if (r <= 4) return { label: '4 – Difficult',         ghLabel: 'feedback: hard'    };
               return { label: '5 – Blocked / broken', ghLabel: 'feedback: blocked' };
}

/** Formats the payload into a GitHub issue body. */
function buildIssueBody(p: FeedbackPayload): string {
  const { label } = ratingMeta(p.rating);
  return [
    '## User Feedback',
    '',
    `| Field | Value |`,
    `|---|---|`,
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
    '',
    '---',
    '*Auto-generated from the in-app feedback widget. Review and add implementation detail before assigning.*',
  ].join('\n');
}

/** Derives a concise issue title from the user's goal (max 72 chars). */
function buildIssueTitle(p: FeedbackPayload): string {
  const prefix = `[Feedback] `;
  const max    = 72 - prefix.length;
  const goal   = p.goal.replace(/\n/g, ' ').trim();
  const trimmed = goal.length > max ? goal.slice(0, max - 1) + '…' : goal;
  return `${prefix}${trimmed}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate env
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.error('Missing GitHub env vars');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  // Validate payload
  const payload = req.body as FeedbackPayload;
  if (!payload?.goal?.trim() || !payload?.result?.trim()) {
    return res.status(400).json({ error: 'goal and result are required' });
  }

  const { ghLabel } = ratingMeta(payload.rating ?? 3);

  // Create GitHub issue
  const ghRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title:  buildIssueTitle(payload),
        body:   buildIssueBody(payload),
        labels: ['user-feedback', 'ux', ghLabel],
      }),
    },
  );

  if (!ghRes.ok) {
    const err = await ghRes.text();
    console.error('GitHub API error:', err);
    return res.status(502).json({ error: 'Failed to create issue' });
  }

  const issue = await ghRes.json() as { number: number; html_url: string };
  return res.status(201).json({ issueNumber: issue.number, issueUrl: issue.html_url });
}
