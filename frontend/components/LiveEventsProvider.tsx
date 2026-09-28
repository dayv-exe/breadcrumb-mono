import { Crumb } from '@/api/models/crumb';
import { events } from 'aws-amplify/data';
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';

export type LiveEvents = {
  crumb: Crumb
  notification: { message: string }
}

type LiveEventsProviderProps = {
  userid?: string
  onBeforeConnect?: (userid: string) => void | Promise<void>
}

type EventType = keyof LiveEvents
type Listener<K extends EventType> = (payload: LiveEvents[K]) => void
type Registry = Map<EventType, Set<Listener<any>>>

const LiveEventsContext = createContext<Registry | null>(null)

export function LiveEventsProvider({ userid, onBeforeConnect, children }: PropsWithChildren<LiveEventsProviderProps>) {
  const [registry] = useState<Registry>(new Map())

  const onBeforeConnectRef = useRef(onBeforeConnect)
  useEffect(() => {
    onBeforeConnectRef.current = onBeforeConnect
  },)

  useEffect(() => {
    if (!userid) return

    let channel: Awaited<ReturnType<typeof events.connect>> | undefined
    let cancelled = false;

    (async () => {
      try {
        onBeforeConnectRef.current?.(userid)
      } catch (error) {
        console.warn("On before connect function failed. ERROR: ", error)
      }

      if (cancelled) return

      try {
        channel = await events.connect(`/crumbs/${userid}`)
      } catch (err) {
        console.warn('live connect error', err);
        return
      }
      if (cancelled) {
        channel.close()
        return
      }

      channel.subscribe({
        next: (data) => {
          const evt = typeof data.event === 'string' ? JSON.parse(data.event) : data.event
          if (!evt?.eventType) return
          registry.get(evt.eventType)?.forEach((listener) => listener(evt.payload))
        },
        error: (err) => console.warn('live subscription error', err),
      })
    })()

    return () => { cancelled = true; channel?.close(); }
  }, [userid, registry])

  return <LiveEventsContext.Provider value={registry}>{children}</LiveEventsContext.Provider>;
}

export function useLiveEvent<K extends EventType>(type: K, listener: Listener<K>) {
  const registry = useContext(LiveEventsContext)
  if (!registry) throw new Error('useLiveEvent must be used inside LiveEventsProvider')

  const listenerRef = useRef(listener)
  useEffect(() => {
    listenerRef.current = listener
  })

  useEffect(() => {
    const wrapped: Listener<K> = (payload) => listenerRef.current(payload)
    if (!registry.has(type)) registry.set(type, new Set())
    registry.get(type)!.add(wrapped)
    return () => { registry.get(type)?.delete(wrapped); }
  }, [registry, type])
}