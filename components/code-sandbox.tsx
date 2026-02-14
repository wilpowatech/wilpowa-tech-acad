'use client'

import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react'

export interface CheatingData {
  largePastes: number
  tabSwitches: number
  rapidBursts: number
  copyAttempts: number
  rightClicks: number
  events: string[]
}

export interface CodeSandboxHandle {
  getCode: () => string
  getCheatingData: () => CheatingData
}

interface CodeSandboxProps {
  initialCode?: string
  language?: string
  onCodeChange?: (code: string) => void
  readOnly?: boolean
  height?: string
  monitorCheating?: boolean
}

const CodeSandbox = forwardRef<CodeSandboxHandle, CodeSandboxProps>(function CodeSandbox(
  { initialCode = '', language = 'javascript', onCodeChange, readOnly = false, height = '400px', monitorCheating = true },
  ref
) {
  const [code, setCode] = useState(initialCode || '')
  const [output, setOutput] = useState('')
  const [activeTab, setActiveTab] = useState<'code' | 'output' | 'preview'>('code')
  const [isRunning, setIsRunning] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const lineCount = code.split('\n').length

  // Anti-cheat state
  const [cheating, setCheating] = useState<CheatingData>({
    largePastes: 0, tabSwitches: 0, rapidBursts: 0, copyAttempts: 0, rightClicks: 0, events: [],
  })
  const lastKeyTime = useRef(0)
  const burstCount = useRef(0)
  const warningShown = useRef(false)

  useEffect(() => { if (initialCode) setCode(initialCode) }, [initialCode])

  // Expose handle to parent
  useImperativeHandle(ref, () => ({
    getCode: () => code,
    getCheatingData: () => cheating,
  }), [code, cheating])

  const logEvent = useCallback((msg: string) => {
    setCheating(prev => ({ ...prev, events: [...prev.events, `${new Date().toISOString()}: ${msg}`] }))
  }, [])

  // Monitor tab/visibility changes
  useEffect(() => {
    if (!monitorCheating) return
    const handler = () => {
      if (document.hidden) {
        setCheating(prev => ({ ...prev, tabSwitches: prev.tabSwitches + 1 }))
        logEvent('Switched away from tab')
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [monitorCheating, logEvent])

  // Block right-click in sandbox area
  useEffect(() => {
    if (!monitorCheating) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-sandbox]')) {
        e.preventDefault()
        setCheating(prev => ({ ...prev, rightClicks: prev.rightClicks + 1 }))
        logEvent('Right-click attempted')
      }
    }
    document.addEventListener('contextmenu', handler)
    return () => document.removeEventListener('contextmenu', handler)
  }, [monitorCheating, logEvent])

  const handleCodeChange = useCallback((value: string) => {
    setCode(value)
    onCodeChange?.(value)
  }, [onCodeChange])

  // Detect large pastes
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (!monitorCheating) return
    const text = e.clipboardData.getData('text')
    if (text.length > 80) {
      setCheating(prev => ({ ...prev, largePastes: prev.largePastes + 1 }))
      logEvent(`Large paste detected: ${text.length} characters`)
      if (!warningShown.current) {
        warningShown.current = true
      }
    }
  }, [monitorCheating, logEvent])

  // Detect copy attempts
  const handleCopy = useCallback(() => {
    if (!monitorCheating) return
    setCheating(prev => ({ ...prev, copyAttempts: prev.copyAttempts + 1 }))
    logEvent('Copy attempted')
  }, [monitorCheating, logEvent])

  // Detect rapid typing (possible auto-type tools)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const newCode = code.substring(0, start) + '  ' + code.substring(end)
      handleCodeChange(newCode)
      setTimeout(() => { target.selectionStart = target.selectionEnd = start + 2 }, 0)
      return
    }

    if (!monitorCheating) return
    const now = Date.now()
    if (now - lastKeyTime.current < 25) {
      burstCount.current++
      if (burstCount.current > 30) {
        setCheating(prev => ({ ...prev, rapidBursts: prev.rapidBursts + 1 }))
        logEvent('Rapid typing burst detected (possible automation)')
        burstCount.current = 0
      }
    } else {
      burstCount.current = 0
    }
    lastKeyTime.current = now
  }

  const runCode = useCallback(() => {
    setIsRunning(true)
    setOutput('')

    if (language === 'html' || code.includes('<!DOCTYPE') || code.includes('<html')) {
      setActiveTab('preview')
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument
        if (doc) { doc.open(); doc.write(code); doc.close() }
      }
      setIsRunning(false)
      return
    }

    setActiveTab('output')
    const logs: string[] = []
    try {
      const sandboxConsole = {
        log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        error: (...args: any[]) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
        info: (...args: any[]) => logs.push('[INFO] ' + args.map(a => String(a)).join(' ')),
      }
      const fn = new Function('console', code)
      fn(sandboxConsole)
      setOutput(logs.length > 0 ? logs.join('\n') : 'Code executed successfully (no output)')
    } catch (err) {
      setOutput(`Error: ${(err as Error).message}`)
    } finally {
      setIsRunning(false)
    }
  }, [code, language])

  const totalFlags = cheating.largePastes + cheating.tabSwitches + cheating.rapidBursts

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-[#0d1117]" data-sandbox>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#161b22]">
        <div className="flex gap-1">
          <button onClick={() => setActiveTab('code')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'code' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Code</button>
          <button onClick={() => setActiveTab('output')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'output' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Output</button>
          {(language === 'html' || code.includes('<html')) && (
            <button onClick={() => setActiveTab('preview')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Preview</button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {monitorCheating && totalFlags > 0 && (
            <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20" title={`${cheating.largePastes} paste(s), ${cheating.tabSwitches} tab switch(es), ${cheating.rapidBursts} rapid burst(s)`}>
              {totalFlags} flag{totalFlags !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-mono">{language}</span>
          {!readOnly && (
            <button onClick={runCode} disabled={isRunning} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              {isRunning ? 'Running...' : 'Run'}
            </button>
          )}
        </div>
      </div>

      {/* Code editor */}
      {activeTab === 'code' && (
        <div className="relative flex" style={{ height }}>
          <div className="bg-[#0d1117] border-r border-border/30 px-3 py-3 text-right select-none overflow-hidden" style={{ minWidth: '48px' }}>
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className="text-xs text-muted-foreground/40 font-mono leading-5">{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCopy={handleCopy}
            readOnly={readOnly}
            spellCheck={false}
            className="flex-1 resize-none px-4 py-3 bg-transparent text-[#e6edf3] font-mono text-sm leading-5 focus:outline-none overflow-auto"
            style={{ tabSize: 2 }}
            placeholder="Write your code here..."
          />
        </div>
      )}

      {activeTab === 'output' && (
        <div className="p-4 overflow-auto font-mono text-sm" style={{ height }}>
          {output ? (
            <pre className="whitespace-pre-wrap">{output.split('\n').map((line, i) => (
              <div key={i} className={line.startsWith('[ERROR]') ? 'text-red-400' : line.startsWith('[WARN]') ? 'text-amber-400' : 'text-green-300'}>
                <span className="text-muted-foreground/40 mr-2 select-none">{'>'}</span>{line}
              </div>
            ))}</pre>
          ) : (
            <p className="text-muted-foreground">Click "Run" to execute your code.</p>
          )}
        </div>
      )}

      {activeTab === 'preview' && (
        <div style={{ height }}>
          <iframe ref={iframeRef} title="Preview" className="w-full h-full bg-white border-0" sandbox="allow-scripts" />
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-t border-border text-xs text-muted-foreground">
        <span>{lineCount} line{lineCount !== 1 ? 's' : ''} | {code.length} chars</span>
        <div className="flex items-center gap-3">
          {monitorCheating && (
            <span className={totalFlags > 0 ? 'text-amber-400' : 'text-green-400'}>
              Integrity: {totalFlags === 0 ? 'Clean' : `${totalFlags} flag${totalFlags !== 1 ? 's' : ''}`}
            </span>
          )}
          <span>{language === 'javascript' ? 'JavaScript' : language === 'typescript' ? 'TypeScript' : language}</span>
        </div>
      </div>
    </div>
  )
})

export default CodeSandbox
