/**
 * GitHub Auto-Scoring Bot
 * Fetches repo contents via GitHub REST API and scores based on:
 * - Repo exists & is public (10 pts)
 * - Has README.md (10 pts) + README quality (10 pts)
 * - Has relevant source files matching lab keywords (20 pts)
 * - Code quality in main files (20 pts)
 * - File count & structure (15 pts)
 * - Package.json / dependencies (15 pts)
 * Total: 100 pts
 */

export interface GitHubScoreResult {
  score: number
  feedback: string
  breakdown: {
    repoExists: number
    readmePresent: number
    readmeQuality: number
    relevantFiles: number
    codeQuality: number
    fileStructure: number
    dependencies: number
  }
  errors: string[]
}

interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  size?: number
}

/**
 * Parse a GitHub URL into owner and repo name
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^/]+)\/([^/\s?#]+)/,
    /github\.com\/([^/]+)\/([^/\s?#]+)\.git/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
    }
  }
  return null
}

/**
 * Fetch JSON from GitHub API with error handling
 */
async function githubFetch(url: string): Promise<{ data: any; ok: boolean; status: number }> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'WilpowaTechAcademy-Scorer',
    }
    // If a GitHub token is available, use it for higher rate limits
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }
    const res = await fetch(url, { headers })
    const data = await res.json()
    return { data, ok: res.ok, status: res.status }
  } catch {
    return { data: null, ok: false, status: 0 }
  }
}

/**
 * Fetch file content from GitHub (raw)
 */
async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'WilpowaTechAcademy-Scorer',
    }
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

/**
 * Score a README file for quality
 */
function scoreReadmeQuality(content: string): { score: number; feedback: string } {
  let score = 0
  const feedback: string[] = []

  // Length check
  if (content.length > 500) { score += 3; feedback.push('Good README length') }
  else if (content.length > 200) { score += 2; feedback.push('Decent README length') }
  else if (content.length > 50) { score += 1; feedback.push('README is short') }
  else { feedback.push('README is very short') }

  // Has headings
  const headingCount = (content.match(/^#{1,3}\s+/gm) || []).length
  if (headingCount >= 3) { score += 2; feedback.push('Well-organized with headings') }
  else if (headingCount >= 1) { score += 1; feedback.push('Has some headings') }

  // Has code blocks
  if (/```[\s\S]*?```/.test(content)) { score += 2; feedback.push('Includes code examples') }

  // Has description/explanation paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 30)
  if (paragraphs.length >= 2) { score += 2; feedback.push('Good explanatory content') }
  else if (paragraphs.length >= 1) { score += 1 }

  // Has links or images
  if (/\[.*?\]\(.*?\)/.test(content) || /!\[.*?\]\(.*?\)/.test(content)) {
    score += 1; feedback.push('Includes links/images')
  }

  return { score: Math.min(score, 10), feedback: feedback.join('. ') }
}

/**
 * Score code quality from file contents
 */
function scoreCodeQuality(files: { path: string; content: string }[]): { score: number; feedback: string } {
  let score = 0
  const feedback: string[] = []
  let totalLines = 0
  let hasComments = false
  let hasFunctions = false
  let hasErrorHandling = false
  let hasImports = false

  for (const file of files) {
    const lines = file.content.split('\n')
    totalLines += lines.length

    // Check for comments
    if (/\/\/|\/\*|\*\/|#\s|<!--/.test(file.content)) hasComments = true

    // Check for function definitions
    if (/function\s+\w+|const\s+\w+\s*=\s*(\(|async)|def\s+\w+|class\s+\w+|export\s+(default\s+)?function/.test(file.content)) {
      hasFunctions = true
    }

    // Check for error handling
    if (/try\s*\{|catch\s*\(|\.catch\(|except\s|rescue\s|if\s*\(.*err/.test(file.content)) {
      hasErrorHandling = true
    }

    // Check for imports/requires
    if (/^(import|from|require|use|using)\s/m.test(file.content)) hasImports = true
  }

  if (hasImports) { score += 4; feedback.push('Uses imports/modules') }
  if (hasFunctions) { score += 5; feedback.push('Has function definitions') }
  if (hasComments) { score += 4; feedback.push('Code has comments') }
  if (hasErrorHandling) { score += 4; feedback.push('Includes error handling') }
  if (totalLines > 50) { score += 3; feedback.push('Substantial codebase') }
  else if (totalLines > 20) { score += 1 }

  return { score: Math.min(score, 20), feedback: feedback.join('. ') }
}

/**
 * Score file structure and organization
 */
function scoreFileStructure(files: GitHubFile[]): { score: number; feedback: string } {
  let score = 0
  const feedback: string[] = []

  const fileCount = files.filter(f => f.type === 'file').length
  const dirCount = files.filter(f => f.type === 'dir').length

  // File count
  if (fileCount >= 5) { score += 5; feedback.push(`${fileCount} files found`) }
  else if (fileCount >= 3) { score += 3; feedback.push(`${fileCount} files found`) }
  else if (fileCount >= 1) { score += 1 }

  // Has directories (organized)
  if (dirCount >= 2) { score += 5; feedback.push('Well-organized with folders') }
  else if (dirCount >= 1) { score += 3; feedback.push('Has folder structure') }

  // Has key files
  const fileNames = files.map(f => f.name.toLowerCase())
  const hasIndex = fileNames.some(f => f.startsWith('index.'))
  const hasApp = fileNames.some(f => f.startsWith('app.') || f.startsWith('main.'))
  const hasGitignore = fileNames.includes('.gitignore')

  if (hasIndex || hasApp) { score += 3; feedback.push('Has entry point file') }
  if (hasGitignore) { score += 2; feedback.push('Has .gitignore') }

  return { score: Math.min(score, 15), feedback: feedback.join('. ') }
}

/**
 * Score dependencies relevance
 */
function scoreDependencies(packageJson: any, labKeywords: string[]): { score: number; feedback: string } {
  let score = 0
  const feedback: string[] = []

  if (!packageJson) {
    return { score: 0, feedback: 'No package.json found' }
  }

  const allDeps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  }
  const depNames = Object.keys(allDeps)

  if (depNames.length > 0) {
    score += 5
    feedback.push(`${depNames.length} dependencies`)
  }

  // Has scripts
  if (packageJson.scripts && Object.keys(packageJson.scripts).length > 0) {
    score += 3
    feedback.push('Has npm scripts')
  }

  // Check if dependencies relate to lab keywords
  const keywordsLower = labKeywords.map(k => k.toLowerCase())
  const relevantDeps = depNames.filter(dep =>
    keywordsLower.some(kw => dep.toLowerCase().includes(kw) || kw.includes(dep.toLowerCase()))
  )
  if (relevantDeps.length > 0) {
    score += 5
    feedback.push(`Relevant packages: ${relevantDeps.slice(0, 3).join(', ')}`)
  }

  // Has a name and description
  if (packageJson.name) { score += 1 }
  if (packageJson.description) { score += 1 }

  return { score: Math.min(score, 15), feedback: feedback.join('. ') }
}

/**
 * Main scoring function: score a GitHub repo for a lab
 */
export async function scoreGitHubRepo(
  githubUrl: string,
  labKeywords: string[] = []
): Promise<GitHubScoreResult> {
  const result: GitHubScoreResult = {
    score: 0,
    feedback: '',
    breakdown: {
      repoExists: 0,
      readmePresent: 0,
      readmeQuality: 0,
      relevantFiles: 0,
      codeQuality: 0,
      fileStructure: 0,
      dependencies: 0,
    },
    errors: [],
  }

  // Parse URL
  const parsed = parseGitHubUrl(githubUrl)
  if (!parsed) {
    result.errors.push('Invalid GitHub URL format')
    result.feedback = 'Could not parse GitHub URL. Use format: https://github.com/owner/repo'
    return result
  }

  const { owner, repo } = parsed

  // 1. Check repo exists (10 pts)
  const repoRes = await githubFetch(`https://api.github.com/repos/${owner}/${repo}`)
  if (!repoRes.ok) {
    result.errors.push('Repository not found or is private')
    result.feedback = 'Repository not found or is private. Make sure the repo is public.'
    return result
  }
  result.breakdown.repoExists = 10

  // 2. Fetch file tree
  const treeRes = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/contents`)
  const rootFiles: GitHubFile[] = treeRes.ok ? treeRes.data : []

  // 3. Check README (10 pts)
  const readmeFile = rootFiles.find(f => f.name.toLowerCase().startsWith('readme'))
  let readmeContent = ''
  if (readmeFile) {
    result.breakdown.readmePresent = 10
    readmeContent = await fetchFileContent(owner, repo, readmeFile.path) || ''
  }

  // 4. Score README quality (10 pts)
  if (readmeContent) {
    const readmeScore = scoreReadmeQuality(readmeContent)
    result.breakdown.readmeQuality = readmeScore.score
  }

  // 5. Score relevant source files (20 pts)
  const sourceExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.vue', '.svelte', '.go', '.java', '.rb']
  const sourceFiles = rootFiles.filter(f =>
    f.type === 'file' && sourceExtensions.some(ext => f.name.endsWith(ext))
  )

  // Also check subdirectories for source files (src/, app/, etc.)
  const codeDirs = rootFiles.filter(f => f.type === 'dir' && ['src', 'app', 'lib', 'components', 'pages', 'public', 'scripts'].includes(f.name.toLowerCase()))
  for (const dir of codeDirs.slice(0, 3)) {
    const dirRes = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dir.path}`)
    if (dirRes.ok) {
      const dirFiles = (dirRes.data as GitHubFile[]).filter(f =>
        f.type === 'file' && sourceExtensions.some(ext => f.name.endsWith(ext))
      )
      sourceFiles.push(...dirFiles)
    }
  }

  // Check if source files match lab keywords
  if (sourceFiles.length > 0) {
    let relevanceScore = Math.min(sourceFiles.length * 2, 10)

    // Keyword matching in file names and paths
    if (labKeywords.length > 0) {
      const keywordsLower = labKeywords.map(k => k.toLowerCase())
      const matchedFiles = sourceFiles.filter(f =>
        keywordsLower.some(kw => f.name.toLowerCase().includes(kw) || f.path.toLowerCase().includes(kw))
      )
      relevanceScore += Math.min(matchedFiles.length * 2, 10)
    } else {
      relevanceScore += 5 // Give base score if no keywords provided
    }

    result.breakdown.relevantFiles = Math.min(relevanceScore, 20)
  }

  // 6. Score code quality (20 pts) - fetch up to 5 source files
  const filesToCheck = sourceFiles.slice(0, 5)
  const fileContents: { path: string; content: string }[] = []
  for (const file of filesToCheck) {
    const content = await fetchFileContent(owner, repo, file.path)
    if (content) {
      fileContents.push({ path: file.path, content })
    }
  }

  if (fileContents.length > 0) {
    const codeScore = scoreCodeQuality(fileContents)
    result.breakdown.codeQuality = codeScore.score
  }

  // 7. Score file structure (15 pts)
  const structureScore = scoreFileStructure(rootFiles)
  result.breakdown.fileStructure = structureScore.score

  // 8. Score dependencies (15 pts)
  const pkgFile = rootFiles.find(f => f.name === 'package.json')
  if (pkgFile) {
    const pkgContent = await fetchFileContent(owner, repo, 'package.json')
    if (pkgContent) {
      try {
        const pkgJson = JSON.parse(pkgContent)
        const depScore = scoreDependencies(pkgJson, labKeywords)
        result.breakdown.dependencies = depScore.score
      } catch {
        result.errors.push('Could not parse package.json')
      }
    }
  }

  // Calculate total
  result.score = Object.values(result.breakdown).reduce((sum, v) => sum + v, 0)

  // Generate feedback
  const feedbackParts: string[] = []
  if (result.breakdown.repoExists === 10) feedbackParts.push('Repository found and accessible')
  if (result.breakdown.readmePresent === 10) feedbackParts.push('README present')
  else feedbackParts.push('Missing README.md')
  if (result.breakdown.codeQuality >= 15) feedbackParts.push('Good code quality')
  else if (result.breakdown.codeQuality >= 8) feedbackParts.push('Decent code structure')
  if (result.breakdown.fileStructure >= 10) feedbackParts.push('Well-organized project')
  if (result.breakdown.dependencies >= 10) feedbackParts.push('Good dependency management')
  feedbackParts.push(`Total score: ${result.score}/100`)

  result.feedback = feedbackParts.join('. ')

  return result
}
