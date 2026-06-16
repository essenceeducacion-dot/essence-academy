import Link from "next/link";
import { Logo } from "@/components/marca/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-marino px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/login" className="inline-block">
            <Logo className="text-2xl" />
          </Link>
          <p className="mt-2 text-sm text-crema/50">Academia online de barbería</p>
        </div>
        {children}
      </div>
    </main>
  );
}
