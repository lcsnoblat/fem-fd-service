import { ImageIcon } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export default function GalleryPage() {
  return (
    <ComingSoon
      icon={ImageIcon}
      color="text-module-gallery"
      bg="bg-teal-50"
      title="Gallery"
      description="Your personal image viewer with albums, tags, and AI-powered search."
    />
  )
}
