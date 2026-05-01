import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ArticleData {
  id?: string;
  slug?: string;
  title: string;
  category: string;
  readTime: string;
  date: string;
}

export function FeaturedContentSection({ articles }: { articles?: any[] }) {
  // Dados estáticos de fallback
  const staticArticles: ArticleData[] = [
    {
      title: "O que é valor esperado (EV) e por que ele importa mais que a green",
      category: "Fundamentos",
      readTime: "8 min",
      date: "Em breve"
    },
    {
      title: "Distribuição de Poisson aplicada ao futebol: guia completo",
      category: "Estatística e Modelos",
      readTime: "12 min",
      date: "Em breve"
    },
    {
      title: "O que é backtest em apostas esportivas e como fazer o seu",
      category: "Ferramentas",
      readTime: "10 min",
      date: "Em breve"
    }
  ];

  const displayArticles = articles && articles.length > 0 
    ? articles.map(a => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        category: a.category?.name || "Artigo",
        readTime: "Leitura rápida",
        date: a.publishedAt ? new Intl.DateTimeFormat('pt-BR').format(a.publishedAt) : "Em breve"
      })) 
    : staticArticles;

  return (
    <section className="py-20 bg-surface/30 border-y border-border">
      <div className="container px-4 md:px-6 mx-auto">
        <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
          Últimos estudos e análises
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayArticles.map((article, i) => {
            const innerContent = (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="font-normal">{article.category}</Badge>
                    <span className="text-xs font-mono text-muted-foreground">{article.readTime}</span>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors leading-snug">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="mt-auto">
                  <span className="text-sm text-muted-foreground">{article.date}</span>
                </CardContent>
              </>
            );

            if (article.slug) {
              return (
                <Card key={article.id || i} className="flex flex-col bg-surface hover:border-primary/50 transition-colors group cursor-pointer">
                  <Link href={`/artigos/${article.slug}`} className="contents">
                    {innerContent}
                  </Link>
                </Card>
              );
            }

            return (
              <Card key={i} className="flex flex-col bg-surface border-border opacity-80">
                {innerContent}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  )
}
