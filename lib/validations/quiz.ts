// lib/validations/quiz.ts
import { z } from "zod";

// Uma alternativa de uma questão
const opcaoSchema = z.object({
  id: z.string().min(1),              // ex: "a", "b" — id estável p/ referência
  texto: z.string().min(1).max(500),  // enunciado da alternativa
});

// Uma questão do quiz
const questaoSchema = z.object({
  id: z.string().min(1),                          // id único da questão
  enunciado: z.string().min(1).max(1000),         // pergunta
  tipo: z.literal("multipla_escolha"),            // único tipo por ora (extensível)
  opcoes: z.array(opcaoSchema).min(2).max(6),     // de 2 a 6 alternativas
  respostaCorreta: z.string().min(1),             // id da opção correta
  explicacao: z.string().max(1000).optional(),    // feedback exibido após responder
})
  // A resposta correta deve referenciar uma opção existente
  .refine(
    (q) => q.opcoes.some((o) => o.id === q.respostaCorreta),
    { message: "respostaCorreta deve referenciar o id de uma opção existente", path: ["respostaCorreta"] }
  )
  // Os ids das opções devem ser únicos dentro da questão
  .refine(
    (q) => new Set(q.opcoes.map((o) => o.id)).size === q.opcoes.length,
    { message: "ids das opções devem ser únicos", path: ["opcoes"] }
  );

// Schema completo do campo questions (Json) do model Quiz
export const quizQuestionsSchema = z.array(questaoSchema).min(1).max(50);

// Tipos inferidos p/ uso no front e na API
export type QuizQuestoes = z.infer<typeof quizQuestionsSchema>;
export type QuizQuestao = z.infer<typeof questaoSchema>;

/**
 * REQUISITO DE SEGURANÇA (Fase 5):
 * Ao entregar o quiz para o aluno responder, a API DEVE remover `respostaCorreta` e `explicacao` do payload.
 * Esses campos só retornam após a submissão. A correção sempre roda no servidor.
 * 
 * Exemplo de função utilitária para isso:
 * export function higienizarQuizParaAluno(questions: QuizQuestoes) {
 *   return questions.map(({ respostaCorreta, explicacao, ...rest }) => rest);
 * }
 */
