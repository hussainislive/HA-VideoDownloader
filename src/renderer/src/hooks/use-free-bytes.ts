import { useEffect, useState } from 'react'

interface FreeSpace {
  bytes: number
  path: string
}

export function useFreeBytes(path: string | undefined): number | undefined {
  const [freeSpace, setFreeSpace] = useState<FreeSpace>()

  useEffect(() => {
    if (!path) return
    let current = true
    void window.api.disk.getFreeBytes(path).then((result) => {
      if (current) setFreeSpace(result.ok ? { bytes: result.value, path } : undefined)
    })
    return () => {
      current = false
    }
  }, [path])

  return freeSpace && freeSpace.path === path ? freeSpace.bytes : undefined
}
