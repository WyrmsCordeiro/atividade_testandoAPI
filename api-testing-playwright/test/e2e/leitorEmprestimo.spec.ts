import { test, expect } from '@playwright/test';
import { login, loginNoNavegador, criarlivro, apagarlivro, buscaremprestimoativo, apagaremprestimo } from '../Support/api-helpers';
import { admin, leitor, novolivro } from '../Support/dados';

test.use({ baseURL: 'http://localhost:3000' });

let tokenAdmin: string;
let livro: number;

test.beforeEach(async ({ request, page }) => {
tokenAdmin = await login(request, admin.email, admin.senha);
livro = await criarlivro(request, tokenAdmin, {
...novolivro(1),
isbn: String(Date.now()),
});

await loginNoNavegador(page, request, leitor.email, leitor.senha);
});

test('leitor empresta um livro pela tela e vê mensagem de sucesso e status indisponível', async ({ page }) => {
await page.goto('/livros');

// 1. Clica em "Ver detalhes" na linha do livro criado
await page.getByTestId(`livro-linha-${livro}`).getByRole('link', { name: 'Ver detalhes' }).click();

// 2. Na página de detalhes do livro, clica no botão de emprestar
await page.getByRole('button', { name: /emprestar/i }).click();

// 3. Confere a mensagem de sucesso e que o livro ficou Indisponível
await expect(page.getByText(/sucesso|emprestado/i)).toBeVisible();
await expect(page.getByText('Indisponível')).toBeVisible();
});

test.afterEach(async ({ request }) => {
if (livro && tokenAdmin) {
const emprestimoId = await buscaremprestimoativo(request, tokenAdmin, livro);
if (emprestimoId) {
await apagaremprestimo(request, tokenAdmin, emprestimoId);
}

await apagarlivro(request, tokenAdmin, livro);
}
});

