import { connectDatabase } from './src/database';

export default async function handler(req, res) {
  const { slug } = req.query;  // Captura a parte dinâmica da URL

  if (slug[0] === 'auth' && slug[1] === 'register') {
    // Lógica para a rota /api/auth/register
    if (req.method === 'POST') {
      const { email, password } = req.body;
      try {
        await connectDatabase();
        
        // Lógica para criar o usuário no banco
        console.log('Registrando usuário:', email);

        return res.status(201).json({ message: 'Usuário registrado com sucesso!' });
      } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return res.status(500).json({ error: 'Erro ao registrar usuário' });
      }
    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }
  } else {
    // Para todas as outras rotas, você pode adicionar tratamento de erro 404
    return res.status(404).json({ error: 'Rota não encontrada' });
  }
}
