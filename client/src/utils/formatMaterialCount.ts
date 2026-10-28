const STACK_SIZE = 64
const SHULKER_SIZE = STACK_SIZE * 27

/**
 * Formats an item count as stacks and shulker boxes, e.g.
 * `153 -> "2 × 64 + 25 = 0.09 SB"`.
 */
export default function formatMaterialCount(count: number): string {
  const stacks = Math.floor(count / STACK_SIZE)
  const remainder = count % STACK_SIZE
  const shulkers = (count / SHULKER_SIZE).toFixed(2)

  const stackPart =
    stacks > 0
      ? `${stacks} × ${STACK_SIZE}${remainder ? ` + ${remainder}` : ''}`
      : `${remainder}`

  return `${stackPart} = ${shulkers} SB`
}
