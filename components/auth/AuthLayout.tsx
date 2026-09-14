import Link from "next/link";
import { Waves } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-serif text-lg font-semibold text-navy">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-adriatic text-white">
          <Waves className="h-5 w-5" aria-hidden="true" />
        </span>
        Adria Stay <span className="text-adriatic">Budva</span>
      </Link>

      <Card className="w-full max-w-sm p-6 sm:p-8">
        <h1 className="font-serif text-2xl font-semibold text-navy">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-navy/60">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </Card>

      {footer ? <p className="mt-6 text-sm text-navy/60">{footer}</p> : null}
    </div>
  );
}
