export function ProblemSection() {
  return (
    <section className="py-20 bg-surface/30">
      <div className="container px-4 md:px-6 mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
          O mercado de apostas no Brasil tem um problema.
        </h2>
        <div className="space-y-8">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="text-xl font-bold mb-2">Mais de 95% dos apostadores perdem dinheiro.</h3>
            <p className="text-muted-foreground text-lg">
              Não por azar — por falta de método. Seguem palpites, copiam tips e nunca testam se a estratégia realmente funciona.
            </p>
          </div>
          <div className="border-l-4 border-primary pl-6">
            <h3 className="text-xl font-bold mb-2">Informação superficial está em todo lugar.</h3>
            <p className="text-muted-foreground text-lg">
              Qualquer um abre um canal de tips. Poucos mostram os dados por trás, o backtest, a amostra, a margem de erro. E quase ninguém fala de gestão de risco — o pilar que separa quem sobrevive de quem quebra a banca.
            </p>
          </div>
          <div className="border-l-4 border-primary pl-6">
            <h3 className="text-xl font-bold mb-2">Sem conhecimento, entendimento de mercado e ferramentas, sem chance.</h3>
            <p className="text-muted-foreground text-lg">
              As casas de apostas usam algoritmos, modelos e bilhões de dados históricos. Competir com achismo é trazer uma faca para um tiroteio.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
