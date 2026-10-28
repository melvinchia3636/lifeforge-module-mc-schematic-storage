import { useEffect, useState } from 'react'

import { Flex, Icon, Image } from '@lifeforge/ui'

import { getMaterialIcon } from '@/utils/mcAssets'

/**
 * Renders a 64px isometric icon for an item or block id. Icons are rendered on
 * demand, cached, and shown at a small size so they stay crisp on retina.
 */
export function MaterialIcon({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    setUrl(null)
    setFailed(false)

    getMaterialIcon(id)
      .then(result => {
        if (!cancelled) {
          setUrl(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <Flex
      align="center"
      flexShrink="0"
      height="2em"
      justify="center"
      width="2em"
    >
      {url ? (
        <Image
          alt=""
          fallback={null}
          fit="contain"
          height="100%"
          src={url}
          width="100%"
        />
      ) : (
        <Icon
          color="muted"
          icon={failed ? 'tabler:cube' : 'svg-spinners:ring-resize'}
          size="1.25em"
        />
      )}
    </Flex>
  )
}
