# Auditoria técnica e de imagens — issue #2

Base: branch `work`, commit `9ac3e8437a1e63c24c0a033b8e3e582f92610f1b`. Revisão em 12/11/2026. Não houve alteração da main, merge nem deploy manual.

## Evidências consultadas

Issue: https://github.com/murilompaiva-collab/star-wars-explorer/issues/2

Execução: https://github.com/murilompaiva-collab/star-wars-explorer/actions/runs/43235149749

- Job `auditoria` 131240418755: os logs enumeram 82 registros, IDs 1–83 exceto 17; todos os candidatos responderam HTTP 200. O gerador informou cinco folhas e zero alertas de duplicação exata, resolução abaixo de 200×150 ou download.
- Artefato 13953175066: `auditoria-imagens-personagens`, 819805 bytes, SHA-256 `11c0ca86376520ca1ecbeb1c3146575bbb199fe29aa70c5a695ca9da235a24a8`, associado à base acima.
- O conector localizou o artefato e retornou sua referência de download. O download dos bytes foi bloqueado por HTTP 403; o acesso público alternativo exigiu autenticação. As cinco folhas e os CSVs originais **não puderam ser abertos**. Os resultados agregados vêm dos logs, não de inspeção visual do ZIP.
- A galeria externa e a SWAPI também receberam bloqueio de rede HTTP 403 neste ambiente. Isso é limitação do ambiente, não prova de falha pública dos serviços.

`people-image-review.csv` contém uma linha por ID real, com origem indicada. `tests/fixtures/people-enumeration.json` contém apenas os nomes e URLs extraídos dos logs, não valores de altura, nascimento ou relações. Não se presumiu sequência contínua.

## Resultado fotográfico e direitos

Não foi possível classificar visualmente cada retrato como correto/incorreto/ambíguo/ausente sem abrir as imagens. As 82 linhas permanecem **NÃO VERIFICADO**. Não há identificação individual comprovada de foto trocada ou ausente. Não há aprovação de licença das fotos da galeria.

Foi suspensa a associação automática a fotografias externas por ID. O catálogo mantém os registros e usa o fallback existente com aviso explícito, sem fotos aleatórias ou geradas. Nenhuma fotografia foi remapeada por suposição. O mapeamento local por ID permanece disponível para imagens posteriormente aprovadas. A questão fotográfica da issue #2 continua pendente; não se deve encerrá-la como resolvida.

## Problemas encontrados e correções

1. **Falso alcance do CI:** o job “todos os testes” só executava `.cjs`. Corrigido para `npm ci` e `npm test`, incluindo `.mjs` e `.cjs`. A execução anterior aprovada não comprovava aprovação da suíte completa.
2. **Teste principal falhando:** a galeria automática contrariava o contrato de fallback do teste existente e a política de imagens documentada. O comportamento voltou a exigir mapeamento explícito.
3. **Auditoria superficial:** HEAD/MIME podiam aceitar conteúdo inválido; o script não falhava ao detectar imagem indisponível. Agora GET salva bytes, valida assinatura e emite falha sem perder o CSV. O snapshot JSON conserva campos originais para comparação posterior dos modais.
4. **Duas amostras diferentes:** as folhas antes baixavam novamente as imagens. Agora usam os mesmos bytes da auditoria e geram metadados por registro com formato, dimensões, hash, duplicata e erro. Arquivos antigos não mascaram download atual com falha.
5. **Paginação:** contagem igual podia esconder registros duplicados ou de outra categoria. Agora ambos são rejeitados antes de gravar cache. Cache previamente adulterado ou com URLs duplicadas também é ignorado.
6. **Identificação de imagem:** URLs de outros hosts/categorias com números finais podiam selecionar o mesmo retrato. Extração agora valida host, protocolo, caminho e categoria.
7. **Acabamento:** fallback inteiro, sem recorte; texto explícito de foto pendente/indisponível; foco do card e limites para o rótulo. A identidade escura/dourada foi mantida.

## Testes e alcance

- `npm test`: teste de lógica existente aprovado e 34 testes Node aprovados, incluindo as quatro categorias, imagens e auditoria HTTP.
- Cobertura adicional: 82 IDs em nove páginas, cache sem nova consulta, duplicatas, categoria errada, URLs inválidas, assinatura real versus HTML, falha persistida e descarte de bytes antigos.
- Nas quatro categorias: pesquisa por caixa/acentos, pesquisa vazia, paginação, cache válido/vencido, erros e nova tentativa, campos, relações, título de filme, falha parcial, abertura/fechamento do Bootstrap, respostas tardias e retorno de foco.
- axe-core em jsdom: verificações semânticas da listagem e modal; contraste desativado por depender de renderização.
- `python tests/contact_sheets_test.py`: um teste aprovado cobrindo dimensões, duplicata exata, imagem pequena, conteúdo inválido e geração de folha com os bytes locais de teste. Não usa fotos de terceiros nem publica fixtures no produto.
- JavaScript e Python: verificação de sintaxe; SVG: XML; diff: whitespace.

O preview voltou a falhar com `timed out waiting for relay readiness`. Responsividade foi revisada no CSS (grades, quebra de textos, alvo de toque, movimento reduzido e menu Bootstrap), mas visualização em dispositivos reais, geometria e contraste não foram certificados. Não se afirma validação visual end-to-end.

## Requisitos acadêmicos

| Requisito | Situação e evidência |
|---|---|
| HTML5, CSS3, JS puro e Bootstrap 5 | Atendido no código; sem framework de aplicação, backend ou banco |
| Páginas separadas, cabeçalho, menu e rodapé | Atendido nas cinco páginas; navegação testada |
| Carga automática e paginação de todas as categorias | Implementado e testado com respostas simuladas; disponibilidade ao vivo pendente |
| Cards e pesquisa por nome | Atendido; casos com/sem resultados testados |
| Modal e campos/relacionamentos | Esquemas das quatro categorias cobertos; fidelidade dos valores da API real pendente |
| localStorage JSON | Validade, fallback antigo, falhas e isolamento de relações testados |
| Responsividade e acessibilidade | Implementadas e testadas semanticamente; renderização/contraste reais pendentes |
| Imagens por ID e fallback | Mapeamento local e fallback testados; 82 fotografias ainda sem aprovação visual/licença |
| Simplicidade para apresentação | Scripts separados por função; npm/jsdom/axe e Pillow usados apenas nos testes/auditoria |

## Pendências reais

1. Abrir as cinco folhas originais e inspecionar cada foto; registrar identidade e observações nas 82 linhas.
2. Verificar licença/autorização individual e atribuição antes de reativar fotografias. Nenhuma declaração genérica de uso acadêmico resolve isso.
3. Comparar altura, nascimento e demais campos com um snapshot completo real da SWAPI; os logs antigos só permitem nomes e IDs.
4. Validar desktop e celular em navegador com preview funcional e acesso à SWAPI, incluindo contraste, recorte e overflow.
5. Após o push, conferir a nova execução do Actions; os resultados locais não são apresentados como resultados remotos.

O push solicitado pode disparar integrações já configuradas no GitHub/Vercel. Esta revisão não chama ferramentas de deploy nem altera essas integrações.
