import { checkAdmin } from "@/lib/auth/admin"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await checkAdmin()
  return <>{children}</>
}
