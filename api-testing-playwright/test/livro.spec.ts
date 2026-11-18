import { expect, test, APIRequestContext } from '@playwright/test';

async function fazerLogin(request: APIRequestContext, email: string, senha: string) {
const resposta = await request.post('/api/auth/login', { data: { email, senha } });
expect(resposta.status()).toBe(200);
const { token } = await resposta.json();
return token as string;
}

test('consultar o livro 1 retorna 200, título "Dom Casmurro" e disponível', async ({ request }) => {
const resposta = await request.get('/api/livros/1');

expect(resposta.status()).toBe(200);
const livro = await resposta.json();
expect(livro.titulo).toBe('Dom Casmurro');
expect(livro.disponivel).toBe(true);
});

test('cadastrar livro sem token retorna 401 "Token não informado"', async ({ request }) => {
const resposta = await request.post('/api/livros', {
data: {
titulo: 'Sem Token',
autor: 'Ninguém',
isbn: '9788500000999',
anoPublicacao: 2020,
quantidade: 1,
},
});

expect(resposta.status()).toBe(401);
const corpo = await resposta.json();
expect(corpo.erro).toBe('Token não informado');
});

test('emprestar "Vidas Secas" (id 4, sem exemplares) retorna 409 "Livro indisponível"', async ({ request }) => {
const token = await fazerLogin(request, 'leitor@biblioteca.com', 'Leitor@123');

const resposta = await request.post('/api/emprestimos', {
headers: { Authorization: `Bearer ${token}` },
data: { livroId: 4 },
});

expect(resposta.status()).toBe(409);
const corpo = await resposta.json();
expect(corpo.erro).toBe('Livro indisponível');
});

test('admin cadastra um livro e a API retorna 201 com os dados enviados e um id', async ({ request }) => {
const token = await fazerLogin(request, 'admin@biblioteca.com', 'Admin@123');
const headers = { Authorization: `Bearer ${token}` };

const novoLivro = {
titulo: 'Livro de Teste Playwright',
autor: 'Autora Teste',
isbn: String(Date.now()),
anoPublicacao: 2020,
quantidade: 4,
};

const resposta = await request.post('/api/livros', { headers, data: novoLivro });
const criado = await resposta.json();

try {
expect(resposta.status()).toBe(201);
expect(criado.id).toBeDefined();
expect(criado).toMatchObject(novoLivro);
} finally {
if (criado.id) {
const exclusao = await request.delete(`/api/livros/${criado.id}`, { headers });
expect(exclusao.status()).toBe(204);
}
}
});

test('leitor não pode cadastrar livro e a API retorna 403', async ({ request }) => {
const token = await fazerLogin(request, 'leitor@biblioteca.com', 'Leitor@123');

const resposta = await request.post('/api/livros', {
headers: { Authorization: `Bearer ${token}` },
data: {
titulo: 'Livro do Leitor',
autor: 'Leitor Teste',
isbn: String(Date.now()),
anoPublicacao: 2020,
quantidade: 1,
},
});

expect(resposta.status()).toBe(403);
const corpo = await resposta.json();
expect(corpo.status).toBe(403);
});

