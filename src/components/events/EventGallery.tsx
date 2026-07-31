'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: string[]
  title: string
}

const slide = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? '-100%' : '100%', opacity: 0 }),
}

export function EventGallery({ images, title }: Props) {
  const [[index, direction], setState] = useState<[number, number]>([0, 0])
  const count = images.length

  const paginate = useCallback(
    (delta: number) => setState(([i]) => [(i + delta + count) % count, delta]),
    [count]
  )

  const jumpTo = useCallback(
    (next: number) => setState(([i]) => [next, next > i ? 1 : -1]),
    []
  )

  useEffect(() => {
    if (count < 2) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') paginate(-1)
      if (e.key === 'ArrowRight') paginate(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paginate, count])

  if (count === 0) return null

  return (
    <section aria-label={`Photos from ${title}`} className="space-y-3">
      <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted shadow-lg">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'spring', stiffness: 300, damping: 32 }, opacity: { duration: 0.2 } }}
            drag={count > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) paginate(1)
              else if (info.offset.x > 80) paginate(-1)
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <Image
              src={images[index]}
              alt={`${title} — photo ${index + 1} of ${count}`}
              fill
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="pointer-events-none select-none object-cover"
              priority={index === 0}
            />
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => paginate(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur transition hover:bg-black/70 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur transition hover:bg-black/70 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => jumpTo(i)}
              aria-label={`Go to photo ${i + 1}`}
              aria-current={i === index}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md transition ${
                i === index
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
