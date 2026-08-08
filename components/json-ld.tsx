/**
 * Emits a schema.org JSON-LD block.
 *
 * `<` is escaped because a literal `</script>` anywhere in the data — a title
 * or description is enough — would otherwise close the tag early and inject
 * the rest as markup.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
