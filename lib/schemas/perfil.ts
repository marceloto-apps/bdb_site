import { z } from 'zod'


export const atualizarPerfilSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres').max(80, 'O nome deve ter no máximo 80 caracteres').trim(),
  image: z.string().url('URL de imagem inválida').nullable().optional(),
})

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Informe a senha atual'),
  novaSenha: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres').max(72, 'A nova senha deve ter no máximo 72 caracteres'),
  confirmarNovaSenha: z.string().min(1, 'Confirme a nova senha'),
}).refine((data) => data.novaSenha === data.confirmarNovaSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarNovaSenha'],
}).refine((data) => data.novaSenha !== data.senhaAtual, {
  message: 'A nova senha deve ser diferente da atual',
  path: ['novaSenha'],
})

export const excluirContaSchema = z.object({
  confirmacao: z.literal('EXCLUIR MINHA CONTA', {
    errorMap: () => ({ message: 'Você deve digitar exatamente EXCLUIR MINHA CONTA' })
  }),
  senha: z.string().optional(),
})

export type AtualizarPerfilInput = z.infer<typeof atualizarPerfilSchema>
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>
export type ExcluirContaInput = z.infer<typeof excluirContaSchema>
