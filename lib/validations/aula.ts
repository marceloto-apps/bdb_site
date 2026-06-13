// lib/validations/aula.ts
import { z } from "zod";
import { extrairYoutubeId } from "@/lib/video/youtube";
import { extrairBunnyId } from "@/lib/video/bunny";

export const aulaSchema = z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  videoUrl: z
    .string()
    .url({ message: "A URL do vídeo deve ser válida" })
    .refine((u) => extrairYoutubeId(u) !== null || extrairBunnyId(u) !== null, {
      message: "videoUrl deve ser uma URL válida do YouTube ou Bunny.net",
    })
    .optional()
    .nullable()
    .or(z.literal("")),
  contentHtml: z.string().optional().nullable(),
  durationSec: z
    .number()
    .int()
    .nonnegative({ message: "A duração deve ser um número não-negativo" })
    .optional()
    .nullable(),
});
