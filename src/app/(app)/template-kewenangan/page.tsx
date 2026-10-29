import { requirePageRole } from '@/lib/role-guard'
import { TemplateManager } from '@/components/kredens/superadmin/template-manager'

export default async function TemplateKewenanganPage() {
  await requirePageRole(['SUPERADMIN'])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Template Kewenangan Klinis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola daftar kewenangan klinis standar Dinkes per profesi. Selain empat profesi bawaan
          (Dokter, Dokter Gigi, Perawat, Bidan), Anda dapat menambah profesi lain melalui unggahan
          CSV secara massal.
        </p>
      </div>
      <TemplateManager />
    </div>
  )
}
