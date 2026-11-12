# Imagens: publicação e direitos

A galeria `https://starwarsgallery.netlify.app/assets/people/{id}.jpg` é uma **fonte candidata para auditoria**, não uma fonte automaticamente aprovada. A correspondência de IDs não garante identidade; HTTP 200 não é autorização de uso.

## Estado desta revisão

- Nenhuma fotografia desta galeria teve identidade **e** licença comprovadas nesta sessão.
- A associação automática foi suspensa. Os 82 registros continuam acessíveis com o fallback SVG local e o aviso “FOTO NÃO VALIDADA”. Não houve substituição por fotos aleatórias ou geradas.
- As ilustrações locais de outras categorias e as funcionalidades de pesquisa, cache e modal foram preservadas.
- O código aceita substituições locais individuais em `SW.images.records`, após revisão e registro dos direitos. IDs são extraídos da URL SWAPI, nunca da posição no array.
- Fotografias serão reativadas individualmente quando as verificações abaixo estiverem completas. Isso é uma pendência real, não uma auditoria visual concluída.

## Antes de incluir cada fotografia

1. Identificar a pessoa na imagem, confrontando referências confiáveis. Sem certeza, classificar como ambígua e manter o fallback.
2. Confirmar autor/titular e autorização para republicar; registrar URL original, licença e condições de crédito. Uso acadêmico não substitui permissão.
3. Guardar o arquivo local, preservando proporções, sem marcas d'água removidas; conferir formato e resolução.
4. Registrar o ID, arquivo, fonte, autor, licença, crédito, data e responsável pela conferência neste documento e no CSV de revisão.
5. Atualizar `records.people[id]` e testar carregamento, falha e apresentação móvel.

## Registro de licenças de fotografias usadas

Nenhuma fotografia de terceiro é usada nesta revisão. Uma entrada legada citava `File:Luke_Skywalker_-_Welcome_Banner.jpg`, “Star Wars / Bonnie Burton” e CC BY 2.0. Essa atribuição **não foi revalidada**, não corresponde a um arquivo presente no repositório e não autoriza as outras 81 fotos nem a galeria. Deve ser conferida na fonte antes de qualquer uso; não é tratada como licença aprovada.

Fotogramas, pôsteres, imagens promocionais e conteúdo do Star Wars Databank podem ser protegidos. Disponibilidade pública e ausência de marca d'água não autorizam republicação.

## Evidências e reprodução

- `people-image-review.csv`: 82 nomes/IDs e HTTP histórico extraídos dos logs da execução 43235149749. Colunas de dimensões e identidade permanecem sem aprovação.
- `AUDITORIA.md`: resultados, limitações e requisitos acadêmicos.
- `node scripts/audit-people-images.cjs`: pagina a SWAPI, salva o JSON integral e baixa por GET os bytes dos candidatos, verificando MIME e assinatura. Falhas geram código de saída não zero.
- `python scripts/create-contact-sheets.py`: decodifica **os mesmos bytes**, registra dimensões/formato/SHA-256/duplicatas, gera as folhas e marca erros. Hashes diferentes não descartam duplicatas visuais ou imagens trocadas.
- As folhas de contato permanecem em artefatos de auditoria, sem incorporação ao site ou ao Git. Não são prova de licença.
