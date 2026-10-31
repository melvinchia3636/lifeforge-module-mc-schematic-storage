import { TURN_STD, boxPx, prop } from './geometry'
import type { BlockProps, ResolverOutput } from '../types'

export default function chest(name: string, props: BlockProps): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (n === 'chest' || n.endsWith('_chest')) {
    const type = prop(props, 'type', 'single')
    const yaw = TURN_STD[prop(props, 'facing', 'north')] ?? 0
    const seam = 0.5
    const seamY0 = 10 - seam
    const seamY1 = 10 + seam

    if (type === 'left') {
      return {
        boxes: [
          boxPx(1, 0, 1, 16, seamY0, 15),
          boxPx(1 + seam, seamY0, 1 + seam, 16, seamY1, 15 - seam),
          boxPx(1, seamY1, 1, 16, 14, 15),
          boxPx(15, 7, 0, 16, 11, 1)
        ],
        yaw
      }
    }

    if (type === 'right') {
      return {
        boxes: [
          boxPx(0, 0, 1, 15, seamY0, 15),
          boxPx(0, seamY0, 1 + seam, 15 - seam, seamY1, 15 - seam),
          boxPx(0, seamY1, 1, 15, 14, 15),
          boxPx(0, 7, 0, 1, 11, 1)
        ],
        yaw
      }
    }

    return {
      boxes: [
        boxPx(1, 0, 1, 15, seamY0, 15),
        boxPx(1 + seam, seamY0, 1 + seam, 15 - seam, seamY1, 15 - seam),
        boxPx(1, seamY1, 1, 15, 14, 15),
        boxPx(7, 7, 0, 9, 11, 1)
      ],
      yaw
    }
  }

  return null
}
