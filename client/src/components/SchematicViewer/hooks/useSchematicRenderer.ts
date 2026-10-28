import { useCallback, useEffect, useRef, useState } from 'react'

import { usePersonalization } from '@lifeforge/ui'

import type { ParsedSchematic } from '@/utils/schematicPreview'

import { type Renderer, createSchematicRenderer } from '../../../../../lib/index'

const CANVAS_MAX_SIZE = 1024
const SUPERSAMPLE = 2
const MIN_ZOOM = 0.4
const MAX_ZOOM = 8
const MIN_PITCH = -Math.PI / 2 + 0.12
const MAX_PITCH = Math.PI / 2 - 0.12
const DEFAULT_YAW = Math.PI / 4
const DEFAULT_PITCH = 0.615

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const wrapAngle = (angle: number): number =>
  ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function useSchematicRenderer({
  canvasRef,
  containerRef,
  parsed
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  parsed: ParsedSchematic
}) {
  const { derivedThemeColor } = usePersonalization()
  const rendererRef = useRef<Renderer | null>(null)
  const rafRef = useRef<number | null>(null)
  const yawRef = useRef(DEFAULT_YAW)
  const pitchRef = useRef(DEFAULT_PITCH)
  const zoomRef = useRef(1)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null)
  const yawLabelRef = useRef<HTMLElement | null>(null)
  const zoomLabelRef = useRef<HTMLElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(false)
  const [aspect, setAspect] = useState(16 / 9)

  const drawNow = useCallback(() => {
    rendererRef.current?.draw({
      yaw: yawRef.current,
      pitch: pitchRef.current,
      zoom: zoomRef.current
    })

    if (yawLabelRef.current) {
      yawLabelRef.current.textContent = `${Math.round(
        ((yawRef.current * 180) / Math.PI + 360) % 360
      )}°`
    }

    if (zoomLabelRef.current) {
      zoomLabelRef.current.textContent = `${Math.round(zoomRef.current * 100)}%`
    }
  }, [])

  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== null) {
      return
    }

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      drawNow()
    })
  }, [drawNow])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const observer = new ResizeObserver(entries => {
      const entry = entries[0]

      if (!entry) {
        return
      }

      const { width, height } = entry.contentRect

      if (width > 0 && height > 0) {
        setAspect(width / height)
      }
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [containerRef])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const width =
      aspect >= 1
        ? CANVAS_MAX_SIZE
        : Math.max(1, Math.round(CANVAS_MAX_SIZE * aspect))
    const height =
      aspect >= 1
        ? Math.max(1, Math.round(CANVAS_MAX_SIZE / aspect))
        : CANVAS_MAX_SIZE

    try {
      rendererRef.current = createSchematicRenderer(parsed, canvas, {
        width,
        height,
        supersample: SUPERSAMPLE,
        transparent: true,
        lineColor: derivedThemeColor
      })
      setError(false)
      drawNow()
    } catch {
      setError(true)
    }

    return () => {
      rendererRef.current = null

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [parsed, derivedThemeColor, aspect, canvasRef, drawNow])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()

      zoomRef.current = clamp(
        zoomRef.current * Math.exp(-event.deltaY * 0.0015),
        MIN_ZOOM,
        MAX_ZOOM
      )
      scheduleDraw()
    }

    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [containerRef, scheduleDraw])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    })

    if (pointersRef.current.size === 1) {
      lastPointerRef.current = { x: event.clientX, y: event.clientY }
      setDragging(true)
    } else if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()]

      if (a && b) {
        pinchRef.current = {
          distance: distance(a, b),
          zoom: zoomRef.current
        }
        lastPointerRef.current = null
      }
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) {
      return
    }

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    })

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()]

      if (a && b) {
        const nextDistance = distance(a, b)

        if (pinchRef.current.distance > 0) {
          zoomRef.current = clamp(
            pinchRef.current.zoom * (nextDistance / pinchRef.current.distance),
            MIN_ZOOM,
            MAX_ZOOM
          )
          scheduleDraw()
        }
      }

      return
    }

    const last = lastPointerRef.current

    if (!last || pointersRef.current.size !== 1) {
      return
    }

    yawRef.current = wrapAngle(
      yawRef.current - (event.clientX - last.x) * 0.008
    )
    pitchRef.current = clamp(
      pitchRef.current + (event.clientY - last.y) * 0.008,
      MIN_PITCH,
      MAX_PITCH
    )
    lastPointerRef.current = { x: event.clientX, y: event.clientY }
    scheduleDraw()
  }

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId)
    pinchRef.current = null

    if (pointersRef.current.size === 1) {
      const [remaining] = [...pointersRef.current.values()]

      lastPointerRef.current = remaining ?? null
    } else if (pointersRef.current.size === 0) {
      lastPointerRef.current = null
      setDragging(false)
    }
  }

  return {
    dragging,
    endPointer,
    error,
    handlePointerDown,
    handlePointerMove,
    yawLabelRef,
    zoomLabelRef
  }
}
