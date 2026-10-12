import { spawn } from 'node:child_process'

const mode = process.argv[2]
if (mode === 'chunked') {
  process.stdout.write(Buffer.from([0xe2, 0x82]))
  setTimeout(
    () => process.stdout.write(Buffer.from([0xac, 0x0a, 0x74, 0x77, 0x6f, 0x0d, 0x0a])),
    10,
  )
} else if (mode === 'huge') {
  for (let index = 0; index < 10_000; index += 1) process.stdout.write(`line-${index}\n`)
} else if (mode === 'exit') {
  process.stderr.write('expected failure\n')
  process.exit(7)
} else if (mode === 'grandchild') {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    detached: false,
    shell: false,
    stdio: 'ignore',
    windowsHide: true,
  })
  process.stdout.write(`${child.pid}\n`)
  setInterval(() => {}, 1_000)
}
