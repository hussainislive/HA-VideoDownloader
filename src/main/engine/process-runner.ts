import { type ChildProcess, spawn } from 'node:child_process'
import { win32 } from 'node:path'

export type KillMode = 'graceful' | 'force'

export interface ProcessResult {
  code: number | null
  signal: NodeJS.Signals | null
}

export interface ProcessRunOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  timeoutMs?: number
}

export interface ProcessHandle {
  readonly pid: number | undefined
  readonly result: Promise<ProcessResult>
  onStdoutLine(listener: (line: string) => void): () => void
  onStderrLine(listener: (line: string) => void): () => void
  kill(mode?: KillMode): Promise<void>
}

class LineDecoder {
  readonly #decoder = new TextDecoder()
  #pending = ''

  push(chunk: Uint8Array, emit: (line: string) => void): void {
    this.#pending += this.#decoder.decode(chunk, { stream: true })
    this.#drain(emit)
  }

  finish(emit: (line: string) => void): void {
    this.#pending += this.#decoder.decode()
    this.#drain(emit)
    if (this.#pending.length > 0) emit(this.#pending)
    this.#pending = ''
  }

  #drain(emit: (line: string) => void): void {
    const lines = this.#pending.split(/\r?\n/u)
    this.#pending = lines.pop() ?? ''
    for (const line of lines) emit(line)
  }
}

function sanitizedEnvironment(overrides?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env = { ...process.env, ...overrides }
  delete env.NODE_OPTIONS
  return env
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

async function killWindowsTree(pid: number): Promise<void> {
  const child = spawn(windowsTaskkillPath(), ['/pid', String(pid), '/T', '/F'], {
    shell: false,
    windowsHide: true,
    stdio: 'ignore',
  })
  await new Promise<void>((resolve) => child.once('close', () => resolve()))
}

export function windowsTaskkillPath(env: NodeJS.ProcessEnv = process.env): string {
  const windowsRoot = env.SystemRoot ?? env.WINDIR
  return windowsRoot ? win32.join(windowsRoot, 'System32', 'taskkill.exe') : 'taskkill.exe'
}

async function killPosixTree(child: ChildProcess, pid: number, force: boolean): Promise<void> {
  const signal: NodeJS.Signals = force ? 'SIGKILL' : 'SIGTERM'
  try {
    process.kill(-pid, signal)
  } catch {
    child.kill(signal)
  }
  if (!force) {
    await Promise.race([
      new Promise<void>((resolve) => child.once('close', () => resolve())),
      wait(3_000),
    ])
    if (child.exitCode === null && child.signalCode === null) {
      try {
        process.kill(-pid, 'SIGKILL')
      } catch {
        child.kill('SIGKILL')
      }
    }
  }
}

export class ProcessRunner {
  start(file: string, args: readonly string[], options: ProcessRunOptions = {}): ProcessHandle {
    const child = spawn(file, [...args], {
      cwd: options.cwd,
      detached: process.platform !== 'win32',
      env: sanitizedEnvironment(options.env),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    const stdoutListeners = new Set<(line: string) => void>()
    const stderrListeners = new Set<(line: string) => void>()
    const stdout = new LineDecoder()
    const stderr = new LineDecoder()
    child.stdout?.on('data', (chunk: Buffer) =>
      stdout.push(chunk, (line) => this.#emit(stdoutListeners, line)),
    )
    child.stderr?.on('data', (chunk: Buffer) =>
      stderr.push(chunk, (line) => this.#emit(stderrListeners, line)),
    )

    let timer: NodeJS.Timeout | undefined
    const result = new Promise<ProcessResult>((resolve, reject) => {
      child.once('error', reject)
      child.once('close', (code, signal) => {
        if (timer) clearTimeout(timer)
        stdout.finish((line) => this.#emit(stdoutListeners, line))
        stderr.finish((line) => this.#emit(stderrListeners, line))
        resolve({ code, signal })
      })
    })
    if (options.timeoutMs !== undefined) {
      timer = setTimeout(() => void kill(), options.timeoutMs)
    }

    let killPromise: Promise<void> | undefined
    const kill = (mode: KillMode = 'graceful'): Promise<void> => {
      if (killPromise) return killPromise
      const pid = child.pid
      if (!pid || child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
      killPromise =
        process.platform === 'win32'
          ? killWindowsTree(pid)
          : killPosixTree(child, pid, mode === 'force')
      return killPromise
    }

    return {
      pid: child.pid,
      result,
      onStdoutLine: (listener) => this.#subscribe(stdoutListeners, listener),
      onStderrLine: (listener) => this.#subscribe(stderrListeners, listener),
      kill,
    }
  }

  async run(
    file: string,
    args: readonly string[],
    options: ProcessRunOptions = {},
  ): Promise<ProcessResult & { stdout: string; stderr: string }> {
    const handle = this.start(file, args, options)
    const stdout: string[] = []
    const stderr: string[] = []
    handle.onStdoutLine((line) => stdout.push(line))
    handle.onStderrLine((line) => stderr.push(line))
    const result = await handle.result
    return { ...result, stdout: stdout.join('\n'), stderr: stderr.join('\n') }
  }

  #emit(listeners: ReadonlySet<(line: string) => void>, line: string): void {
    for (const listener of listeners) listener(line)
  }

  #subscribe(listeners: Set<(line: string) => void>, listener: (line: string) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
}
