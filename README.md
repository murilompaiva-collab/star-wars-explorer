# Star Wars Explorer

Projeto acadêmico de Programação Web — IFSP. Site multipágina em HTML5, CSS3, JavaScript puro e Bootstrap 5.3.3. Sem backend, banco de dados ou ferramentas de compilação.

## Executar

Abra a pasta em um servidor estático (por exemplo, a extensão Live Server do VS Code) e acesse `index.html`. Alternativamente, com Python instalado: `python -m http.server 8000` e abra `http://localhost:8000`. É necessário acesso à internet para a primeira consulta à SWAPI. O servidor apenas entrega os arquivos estáticos.

## Etapa atual

- Início com apresentação e links para as quatro categorias.
- Quatro categorias com carregamento automático de todas as páginas da SWAPI, pesquisa local por nome, cards e modal Bootstrap com campos e relações resolvidas sob demanda.
- Planetas, naves e veículos com listagem completa, pesquisa, paginação, cache e modais reutilizados.
- Layout responsivo, foco visível, menu móvel e estados de carregamento, erro e pesquisa sem resultados.

## Organização

- `assets/js/cache.js`: cache JSON versionado, validade de 24 horas e tratamento de falhas no localStorage.
- `assets/js/api.js`: Fetch API com async/await, timeout de 20 segundos por requisição, paginação seguindo `next`, cache e consultas relacionadas.
- `assets/js/images.js`: IDs extraídos das URLs, mapeamento de imagens locais e fallback.
- `assets/js/categories.js`: campos, rótulos e formatação.
- `assets/js/app.js`: interface, pesquisa e modal.
- `assets/css/styles.css`: identidade visual e responsividade.

Scripts comuns com `defer` são executados na ordem declarada. O objeto `SW` compartilha as funções sem bibliotecas adicionais. Dados da API são inseridos com `textContent`.

## Fluxo dos dados

Cada página consulta sua chave `swexplorer:v1:people`, `planets`, `starships` ou `vehicles`. Se o cache estiver válido, não consulta novamente a listagem. Caso contrário, acumula `results` seguindo `next` até o fim e só então grava o cache completo. Se a consulta falhar, usa o cache antigo com aviso; sem cache, apresenta erro e botão de nova tentativa. Se o armazenamento estiver bloqueado, mantém os dados em memória. A pesquisa ignora caixa e acentos e não faz requisições.

Ao abrir o modal, os campos principais aparecem imediatamente. Relações (planeta natal, filmes, espécies, naves e veículos) são consultadas sob demanda e guardadas em chaves individuais `swexplorer:v1:relation:<URL>`, cada uma com validade própria de 24 horas. Consultas concorrentes à mesma relação compartilham a requisição. O cache agregado antigo de relações é ignorado. Falhas individuais não bloqueiam o restante da ficha. Datas e link de origem ficam em informações do registro. Dados desconhecidos são identificados, sem inventar valores.

## Imagens e créditos

Esta etapa usa fallbacks SVG locais por categoria e uma ilustração de planeta feita em CSS. Fotografias reais de personagens ainda dependem de arquivos com permissão de uso verificada. Não são fotografias dos personagens. Para adicionar imagens, inclua arquivos locais com permissão de uso e preencha `SW.images.records.people` usando o ID do registro; registre aqui a fonte e a licença de cada arquivo. Arquivos ausentes retornam ao fallback. Nenhum proxy ou serviço externo de imagens é usado.

Bootstrap 5.3.3 (MIT), arquivos locais obtidos de:
- https://github.com/twbs/bootstrap/tree/v5.3.3/dist
- Licença em `assets/vendor/bootstrap/LICENSE`.

Dados: https://swapi.dev/. Nomes e universo Star Wars pertencem aos respectivos titulares. Projeto educacional independente, sem afiliação com Lucasfilm ou Disney.

## Limitações e validação

O endpoint oficial pode apresentar indisponibilidade ou restrições de CORS/rede. Não há troca silenciosa de API nem dados fictícios no produto. No ambiente de desenvolvimento desta etapa, a política de rede bloqueou o acesso a `swapi.dev`; portanto, a integração real depende de validação em uma conexão que permita esse domínio. Testes com respostas simuladas verificam a lógica, mas não comprovam disponibilidade da API real.

### Verificações desta etapa

- `node --check` nos cinco arquivos JavaScript: aprovado.
- `node tests/verify.mjs`: cenários simulados de paginação, HTTPS, cache válido/vencido/corrompido, erro sem cache, paginação parcial/cíclica, armazenamento bloqueado, relações e fallback de imagem aprovados.
- Links, recursos locais e unicidade de IDs verificados nas cinco páginas.
- Revisão visual e interações reais no navegador pendentes: o serviço de preview falhou ao abrir a conexão do navegador (`timed out waiting for relay readiness`).
- Integração ao vivo com SWAPI pendente: o proxy do ambiente respondeu HTTP 403 ao domínio.


## Revisão técnica das quatro categorias

Base revisada: commit `9f3a77c`, branch `work`.

Correções: rótulo Personagens no menu das três páginas novas; unidades dos campos numéricos; datas ausentes sem conversão para 1970; fallback de imagem da categoria; prazo independente e deduplicação das consultas de relacionamentos; rejeição de listagens incompletas e de protocolos externos ao HTTP/HTTPS; interrupção da atualização do modal ao fechá-lo; botão de limpar desabilitado durante recarga.

Ajustes responsivos preservam a identidade visual: quebra de textos longos, alvos de toque de 44 px e uma coluna de cards em telas menores que 360 px.

### Executar testes

O site continua sem build e sem dependências JavaScript externas em produção, além do Bootstrap local. Node.js 20 ou superior é usado apenas para os testes. Instale as dependências de desenvolvimento com `npm ci` e execute `npm test`. `jsdom` simula o DOM e executa o Bootstrap real; `axe-core` verifica acessibilidade semântica. As respostas SWAPI são simuladas e não entram nos arquivos do produto.

A suíte cobre as quatro categorias: paginação, pesquisa por caixa/acentos, mensagem vazia, limpar pesquisa, cache persistente/vencido, recuperação de erro, campos e relações, filmes por título, falha parcial, fechamento do modal durante requisição e retorno de foco. Também verifica navegação das cinco páginas, recursos locais, referências acessíveis, esquema de campos, unidades, cache independente, consultas concorrentes e rejeição de paginação incompleta.

Limites da revisão: a SWAPI real continua bloqueada pelo proxy (HTTP 403). A revisão de responsividade e consistência visual foi feita no código; renderização, contraste, dimensões e interações em navegador/dispositivo real ainda precisam de validação. Os testes axe no DOM simulado excluem contraste, pois dependem de renderização. Não foi feito deploy nem push nesta revisão, para evitar disparar a integração automática da Vercel.


## Auditoria da issue #2

Veja `docs/AUDITORIA.md`, `docs/people-image-review.csv` e `docs/IMAGENS.md`. A atribuição automática de fotos da galeria externa foi suspensa: identidade e licença permanecem não verificadas. Os registros e fluxos continuam disponíveis com fallback local; não há substituição por fotos aleatórias ou geradas.

`npm test` agora executa todas as suítes `.mjs` e `.cjs`, inclusive a auditoria. Para a auditoria Python, instale `python -m pip install -r scripts/requirements-audit.txt` no seu ambiente de desenvolvimento e execute `python tests/contact_sheets_test.py`. Pillow é usado só para gerar/validar os relatórios, sem backend no site.
