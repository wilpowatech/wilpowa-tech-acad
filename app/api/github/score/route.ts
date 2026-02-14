import { NextResponse } from 'next/server'
import { scoreGitHubRepo, parseGitHubUrl } from '@/lib/github-scorer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { github_url, lab_keywords } = body

    if (!github_url) {
      return NextResponse.json({ error: 'github_url is required' }, { status: 400 })
    }

    // Validate URL format
    const parsed = parseGitHubUrl(github_url)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo' },
        { status: 400 }
      )
    }

    // Score the repo
    const result = await scoreGitHubRepo(github_url, lab_keywords || [])

    return NextResponse.json(result)
  } catch (err) {
    console.error('GitHub scoring error:', err)
    return NextResponse.json(
      { error: 'Failed to score GitHub repository' },
      { status: 500 }
    )
  }
}
