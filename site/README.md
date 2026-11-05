# Trilha ABAP Core: site de estudo interativo

Site de estudo de SAP ABAP em 22 lições que segue a jornada [**Acquiring Core ABAP Skills**](https://learning.sap.com/learning-journeys/acquire-core-abap-skills) da SAP Learning, com visual baseado no design system **SAP Horizon** (temas claro e escuro).

Cada lição traz objetivos, explicação, código ABAP/CDS comentado, ilustrações, um laboratório interativo, um quiz e links para a documentação oficial. Há também uma referência rápida de sintaxe com glossário e um simulado de certificação com 15 questões e nota mínima de 65%.

## Conteúdo

| Curso | Lições |
| :--- | :--- |
| **1. Programação ABAP básica** (Basic ABAP Programming) | Primeiros passos · Técnicas básicas · Classes locais · Lendo dados do banco · Estruturas · Tabelas internas · Business objects e EML · Modelo RAP |
| **2. Programação ABAP intermediária** (Intermediate ABAP Programming) | Análise, testes e documentação · Tipos e conversões · Processando texto · Code pushdown em ABAP SQL · Performance de tabelas internas · Verificações de autorização · Orientação a objetos eficaz · Classes de exceção |
| **3. Dicionário ABAP e CDS** (Data Modeling in ABAP Dictionary and ABAP CDS) | Modelagem e tipos globais · Tabelas de banco · CDS view entities · Relações e associações · Code pushdown em CDS · Anotações e meta objetos |

Os laboratórios simulam no navegador, sobre dados de exemplo inspirados no modelo de voos `/DMO/`, o comportamento de: divisão com `/`, `DIV` e `MOD`; objetos e referências; `SELECT`; `CORRESPONDING`; tabelas standard, sorted e hashed; buffer transacional da EML; camadas do RAP; ABAP Unit; conversões de tipo; funções de texto; agregações; custo de leitura em tabelas internas; `AUTHORITY-CHECK`; polimorfismo; `TRY … CATCH`; definição de tabelas; expressões de caminho em CDS; `CASE` em CDS e anotações `@UI` com prévia Fiori Elements. Eles ajudam a prever o resultado; confirme sempre no ADT.

## Como usar

Abra `index.html` no navegador. O arquivo é autocontido (fontes, ícones e scripts embutidos) e não precisa de servidor nem de internet, exceto para os links externos. O progresso das lições e o tema escolhido ficam salvos no `localStorage` do navegador.

## Como editar

O `index.html` é gerado. Edite os arquivos em `src/` e rode:

```bash
python3 site/build.py
```

| Arquivo | Conteúdo |
| :--- | :--- |
| `src/01_head.html` | `<title>`, tokens SAP Horizon (claro/escuro), `@font-face` e todo o CSS |
| `src/02_shell.html` | Shell bar, navegação lateral e área principal |
| `src/03_c1.html`, `04_c2.html`, `05_c3.html` | Conteúdo das lições dos cursos 1, 2 e 3 (um `<template id="L-…">` por lição) |
| `src/06_data.js` | Lista de cursos e lições, quizzes, referência rápida e glossário |
| `src/07_app.js` | Realce de sintaxe, navegação, pesquisa, progresso, quiz, simulado e roteamento por `#hash` |
| `src/08_widgets.js` | Laboratórios interativos (`data-widget="…"` nos templates) |
| `assets/fonts/` | Fontes 72 e 72 Mono e um subconjunto da fonte SAP-icons |

Para adicionar uma lição: crie o `<template id="L-minha-licao">` no arquivo do curso, registre a lição em `LESSONS` e o quiz em `QUIZ`, ambos em `src/06_data.js`.

## Créditos e licenças

- Cores, fontes 72/72 Mono e ícones SAP-icons vêm do pacote [`@sap-theming/theming-base-content`](https://www.npmjs.com/package/@sap-theming/theming-base-content) 11.29.3, distribuído sob a licença Apache-2.0 (cópia em `assets/fonts/LICENSE-sap-theming.txt`). A fonte de ícones foi reduzida aos glifos usados no site.
- Estrutura inspirada no [Almanaque ABAP](https://bmoreiraribeiro.github.io/ABAP/).
- Referências: [ABAP Keyword Documentation](https://help.sap.com/doc/abapdocu_cp_index_htm/CLOUD/en-US/index.htm) e [ABAP cheat sheets](https://github.com/SAP-samples/abap-cheat-sheets) da SAP.

Projeto de estudo independente, sem vínculo com a SAP. SAP, ABAP, SAP Fiori e SAP Horizon são marcas da SAP SE.
