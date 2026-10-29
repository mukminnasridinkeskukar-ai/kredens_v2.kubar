import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function ReadOnlyEmpty({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground/40" />
        <p className="font-semibold">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/pengajuan">Lihat Status Pengajuan</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function ReadOnlyBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
      {text}
    </div>
  )
}
