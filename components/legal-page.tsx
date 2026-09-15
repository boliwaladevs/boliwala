import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CONTACT } from "@/lib/contact"

/**
 * The shell both legal pages use.
 *
 * The routes exist before the copy does, on purpose: the engineering — routes,
 * metadata, footer links, sitemap entries — does not depend on the wording, and
 * building it now means the client's text is a paste rather than a build.
 *
 * Until then the page says plainly that the policy is being finalised. It does
 * **not** show invented legalese, which would be worse than an empty page: a
 * placeholder privacy policy is a statement about how personal data is handled,
 * and a wrong one is a liability rather than a placeholder.
 */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children?: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{title}</h1>
          <p className="text-muted-foreground leading-relaxed mb-8">{intro}</p>

          <div className="rounded-xl border border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 p-5 mb-8">
            <div className="font-semibold text-foreground mb-1">This policy is being finalised</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The full text is with our legal advisers and will be published here before launch. In the meantime,
              write to{" "}
              <a href={`mailto:${CONTACT.email}`} className="font-medium text-foreground hover:underline">
                {CONTACT.email}
              </a>{" "}
              with any question about {title.toLowerCase()} and we will answer it directly.
            </p>
          </div>

          {children}
        </div>
      </div>
      <Footer />
    </main>
  )
}
