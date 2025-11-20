import { useCallback, useEffect } from 'react'

// type LogEntry = Record<string, unknown> & {
//   timestamp: number
//   event: string
// }

export const EventLog = () => {
  // const [log, setLog] = useState<LogEntry[]>(() => [])

  const addLog = useCallback((name: string, args?: unknown) => {
    const timestamp = +new Date()
    console.log(`${timestamp} ${name}`, args)
    console.timeStamp(name)
    // setLog((log) => [...log, { timestamp, event: name }])
  }, [])

  useEffect(() => {
    const addNamespacedEventLogs = (namespace: keyof typeof chrome) => {
      for (const name in chrome[namespace]) {
        if (name.indexOf('on') === 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(chrome[namespace] as any)[name].addListener(
            (...args: unknown[]) => {
              addLog(`${namespace}.${name}`, args)
            },
          )
        }
      }
    }

    addNamespacedEventLogs('windows')
    addNamespacedEventLogs('tabGroups')
    addNamespacedEventLogs('tabs')
  }, [addLog])

  // return (
  //   <div className="absolute bottom-2 right-2">
  //     {log.map((entry, index) => {
  //       return <div key={index}>{entry.event}</div>
  //     })}
  //   </div>
  // )
  return null
}
