import { GET } from '../../app/api/aulas/[id]/video/route';
import { prisma } from '../../lib/prisma';
import { auth } from '../../auth';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// Mock do prisma para não bater no banco real
vi.mock('../../lib/prisma', () => ({
  prisma: {
    lesson: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock do NextAuth para controlar o estado da sessão
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

describe('GET /api/aulas/[id]/video', () => {
  const mockReq = new Request('http://localhost/api/aulas/lesson1/video');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar 401 se o usuário não estiver autenticado', async () => {
    (auth as any).mockResolvedValue(null);

    const res = await GET(mockReq, { params: { id: 'lesson1' } });
    
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.erro).toBe('Não autenticado');
  });

  it('deve retornar 404 se a aula não existir', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user1', role: 'MEMBRO', plan: 'FREE' } });
    (prisma.lesson.findUnique as any).mockResolvedValue(null);

    const res = await GET(mockReq, { params: { id: 'lesson1' } });
    
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.erro).toBe('Aula não encontrada');
  });

  it('deve retornar 404 se a aula não possuir videoUrl', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user1', role: 'MEMBRO', plan: 'FREE' } });
    (prisma.lesson.findUnique as any).mockResolvedValue({
      videoUrl: null,
      module: { course: { access: 'GRATIS' } },
    });

    const res = await GET(mockReq, { params: { id: 'lesson-sem-video' } });
    
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.erro).toBe('Aula sem vídeo cadastrado');
  });

  it('deve retornar 422 se a URL do vídeo for inválida ou não suportada', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user1', role: 'MEMBRO', plan: 'FREE' } });
    (prisma.lesson.findUnique as any).mockResolvedValue({
      videoUrl: 'https://vimeo.com/123456789',
      module: { course: { access: 'GRATIS' } },
    });

    const res = await GET(mockReq, { params: { id: 'lesson-vimeo' } });
    
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.erro).toBe('URL de vídeo inválida ou não suportada');
  });

  it('deve retornar 200 com a URL do embed do YouTube correta para parâmetros válidos', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user1', role: 'MEMBRO', plan: 'FREE' } });
    (prisma.lesson.findUnique as any).mockResolvedValue({
      videoUrl: 'https://www.youtube.com/watch?v=F3D-d5QJ_0g',
      module: { course: { access: 'GRATIS' } },
    });

    const res = await GET(mockReq, { params: { id: 'lesson-valida-yt' } });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.embedUrl).toBe('https://www.youtube-nocookie.com/embed/F3D-d5QJ_0g?rel=0&modestbranding=1&enablejsapi=1');
  });

  it('deve retornar 200 com a URL do embed do Bunny.net correta para parâmetros válidos', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user1', role: 'MEMBRO', plan: 'FREE' } });
    (prisma.lesson.findUnique as any).mockResolvedValue({
      videoUrl: 'https://player.mediadelivery.net/play/682380/d125c4bb-0467-4ecb-ad78-656ca3e0a1ed',
      module: { course: { access: 'GRATIS' } },
    });

    const res = await GET(mockReq, { params: { id: 'lesson-valida-bunny' } });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.embedUrl).toBe('https://iframe.mediadelivery.net/embed/682380/d125c4bb-0467-4ecb-ad78-656ca3e0a1ed?autoplay=false&loop=false');
  });
});
