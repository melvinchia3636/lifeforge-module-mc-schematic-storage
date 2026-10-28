import { useRef } from 'react'

import { useModuleTranslation } from '@lifeforge/localization'
import { ErrorScreen, Flex, surface } from '@lifeforge/ui'

import type { ParsedSchematic } from '@/utils/schematicPreview'

import { CornerBrackets } from './components/CornerBrackets'
import { StageBackdrop } from './components/StageBackdrop'
import { ViewerHud } from './components/ViewerHud'
import { useSchematicRenderer } from './hooks/useSchematicRenderer'

export function SchematicViewer({ parsed }: { parsed: ParsedSchematic }) {
  const { t } = useModuleTranslation()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const {
    dragging,
    endPointer,
    error,
    handlePointerDown,
    handlePointerMove,
    yawLabelRef,
    zoomLabelRef
  } = useSchematicRenderer({ canvasRef, containerRef, parsed })

  return (
    <Flex
      ref={containerRef}
      align="center"
      bg={surface.light}
      height="50vh"
      justify="center"
      overflow="hidden"
      position="relative"
      r="xl"
      style={{
        cursor: dragging ? 'grabbing' : 'grab',
        isolation: 'isolate',
        touchAction: 'none',
        userSelect: 'none'
      }}
      width="100%"
      onPointerCancel={endPointer}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
    >
      <StageBackdrop />
      {error ? (
        <ErrorScreen message={t('viewer.webglError')} showRetryButton={false} />
      ) : (
        // eslint-disable-next-line local/no-native-elements
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            height: '100%',
            position: 'relative',
            width: '100%',
            zIndex: 1
          }}
        />
      )}
      {!error && (
        <>
          <CornerBrackets />
          <ViewerHud
            hint={t('viewer.hint')}
            yawLabelRef={yawLabelRef}
            zoomLabelRef={zoomLabelRef}
          />
        </>
      )}
    </Flex>
  )
}
