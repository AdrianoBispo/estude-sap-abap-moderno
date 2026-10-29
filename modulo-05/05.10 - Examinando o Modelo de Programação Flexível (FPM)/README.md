# Examinando o Modelo de Programação Flexível (FPM)

![Infográfico - Examinando o Modelo de Programação Flexível (FPM)](./05.10_Fiori_FPM.png)

> **Comece pelos slides: [Flexible Programming Model](./05.10_Flexible_Programming_Model.pptx)**
>
> Material complementar em PDF: [Dominando o Flexible Programming Model](./05.10_Dominando_o_Flexible_Programming_Model.pdf)
## Objetivos de Aprendizagem

- Compreender profundamente o **Flexible Programming Model (FPM)** como a arquitetura moderna que preenche a lacuna entre a rigidez do Fiori Elements e a liberdade total (e cara) do Freestyle UI5.  

- Identificar e aplicar o conceito de **Building Blocks** (Blocos de Construção), utilizando componentes reutilizáveis baseados em metadados dentro de layouts customizados.  

- Utilizar **Extension Points** estrategicamente para inserir seções, colunas ou ações customizadas (JavaScript/XML) sem quebrar o suporte a upgrades do aplicativo padrão.  

- Reconhecer o papel das **Controller Extensions** para injetar lógica de negócio customizada, manipulando o ciclo de vida da página e interagindo com a ExtensionAPI.

## 1. O Dilema: Padrão vs. Flexível

Historicamente, o desenvolvimento de interfaces SAP Fiori apresentava uma dicotomia frustrante para arquitetos e desenvolvedores:

1. **Fiori Elements Padrão:** Oferecia desenvolvimento extremamente rápido (dias) e baixo custo de manutenção. No entanto, era uma "caixa preta". Se o cliente pedisse um requisito visual fora do padrão (ex: "um botão vermelho piscando que abre um mapa"), era impossível de implementar ou exigia "hacks" perigosos que quebravam em atualizações futuras.  

2. **Freestyle UI5:** Oferecia flexibilidade total (você é dono de cada pixel). Porém, o desenvolvimento era lento (semanas/meses), exigia conhecimento profundo de JavaScript e tinha um **Alto Custo Total de Propriedade (TCO)**. Se a SAP mudasse o design system, você teria que reescrever seu app manualmente.

**A Solução (FPM):** O Flexible Programming Model (FPM), introduzido com o OData V4, permite o melhor dos dois mundos. Ele permite que você mantenha 90% da página como Fiori Elements padrão (barato/rápido/estável) e injete código customizado apenas nos 10% que realmente precisam de algo especial. Você não "quebra" o Fiori Elements para customizar; você o "estende" de forma suportada.

## 2. Building Blocks (O "Lego" da SAP)

A grande inovação técnica do FPM são os Building Blocks. Imagine que você decidiu criar uma Seção Customizada (uma View XML própria) para desenhar um layout de dashboard complexo que o padrão não suporta. Porém, dentro desse dashboard, você quer mostrar uma lista de materiais.

No modelo antigo (Freestyle), você teria que instanciar uma `sap.m.Table`, fazer o data binding manual, configurar colunas, implementar a lógica de ordenação e filtro do zero. Com o FPM, você usa **Building Blocks** (namespace sap.fe.macros). São "tags mágicas" que trazem a inteligência do Fiori Elements para dentro da sua view customizada.

### Exemplo de Poder:

``` XML
<!-- Dentro da sua View XML Customizada -->  
<macros:Table metaPath="@com.sap.vocabularies.UI.v1.LineItem" id="MySmartTable" />
```

Com apenas essa linha, o sistema renderiza uma tabela Fiori Elements completa, conectada ao serviço OData, com barra de ferramentas, exportação para Excel, variantes e personalização de colunas, tudo lendo as anotações (`@UI.lineItem`) que você já definiu no Backend (ADT).

* **Outros Building Blocks Comuns:**
  * **`<macros:FilterBar>`:** Barra de filtros inteligente.  
  * **`<macros:Field>`:** Campo de formulário com `F4` (Value Help) e validação.  
  * **`<macros:Chart>`:** Gráficos analíticos baseados em anotações.

## 3. Tipos de Extensão

O FPM oferece pontos de inserção precisos onde podemos "injetar" nossa customização na estrutura padrão do aplicativo:

### A. Custom Sections (Seções Customizadas)

Adiciona uma nova aba (Object Page) ou um novo bloco de conteúdo.

* **Técnica:** Você cria um Fragmento ou View XML e o registra no manifesto.  
* **Uso:** Incorporar mapas (Google Maps/GeoMap), integrar gráficos interativos de bibliotecas de terceiros (D3.js), incorporar players de vídeo ou exibir dados de múltiplas fontes (Mashups) que não estão no serviço principal.

### B. Custom Actions (Ações Customizadas)

Adiciona botões na barra de ferramentas ou no rodapé que executam JavaScript local. Diferente das ações `BDEF` (que rodam lógica no ABAP/Backend), estas rodam no navegador.

* **Técnica:** Registro no manifesto apontando para um método na Controller Extension.  
* **Uso:** Abrir um arquivo PDF em nova aba, chamar uma API REST externa (ex: Consulta de CEP), abrir um diálogo (Popup) complexo para entrada de dados antes de enviar ao backend, ou navegação customizada.

### C. Custom Columns (Colunas Customizadas)

Insere uma coluna na tabela do List Report ou Object Page que contém controles complexos em vez de texto simples.

* **Técnica:** Fragmento XML injetado na definição da tabela.  
* **Uso:** Mostrar um Micro Chart (Sparkline) dentro da linha, um Slider para ajuste rápido de valores, botões de ação inline específicos (ex: "Adicionar ao Carrinho"), ou formatação condicional complexa que anotações não cobrem.

## 4. Controller Extensions

Quando adicionamos uma View ou Fragmento Customizado, inevitavelmente precisamos de lógica (JavaScript) para manipular eventos (cliques, mudanças de valor). No FPM, não substituímos o controlador padrão da página; nós o estendemos. As **Controller Extensions** permitem adicionar código que coexiste com a lógica padrão da SAP.

### Hooks de Ciclo de Vida e Overrides:

* **`override.onInit`**: Permite rodar código assim que a página é inicializada (ex: carregar dados de uma API externa).  
* **`override.editFlow`**: Permite interceptar eventos transacionais. Por exemplo, você pode injetar código antes do save para fazer uma validação de frontend extra ou formatar dados.  
* **`override.routing`**: Permite controlar a navegação, redirecionando o usuário para rotas customizadas sob certas condições.

**Extension API:** Dentro da sua extensão, você tem acesso ao objeto `this.base.getExtensionAPI()`. Esta é a "ponte" oficial para interagir com a página padrão. Através dela, você pode:

* Recarregar a tabela (`refresh()`).  
* Obter os contextos selecionados (`getSelectedContexts()`).  
* Navegar para outras páginas.  
* Gerenciar mensagens de erro.

## 5. Como Implementar (Fiori Tools)

Embora seja tecnicamente possível editar o `manifest.json` manualmente para registrar extensões, é propenso a erros de sintaxe. A recomendação é usar o **Page Map**.

**Fluxo de Trabalho Visual:**

1. Abra o projeto no VS Code / BAS.  
2. Clique com botão direito em webapp > **Show Page Map**.  
3. Selecione a página desejada (ex: Object Page da entidade Travel).  
4. Clique no ícone de lápis ou **Add Custom Section**.  
5. Defina o título da seção (ex: "Geolocalização") e a posição (ex: "After General Information").  
6. A ferramenta gera automaticamente:  
   * O arquivo `.fragment.xml` para o layout.  
   * O arquivo `.js` (Controller Extension) para a lógica.  
   * As entradas complexas de configuração no `manifest.json`.

## 6. Exemplo Visual

Visualize como o FPM permite a "mistura" de componentes:

```
[ Object Page Standard - Viagem 100 ]  
-------------------------------------------------------  
| Header (Standard - RAP)                             |  
| [ Título: Viagem para Berlim ] [ Status: Aprovado ] |  
-------------------------------------------------------  
|                                                     |  
| [ Section: Geral (Standard - RAP) ]                 |  
|   - Form: ID, Data, Cliente (Gerado via Anotações)  |  
|                                                     |  
| [ Section: Geolocalização (CUSTOM - FPM) ]          | <--- Sua View XML Injetada  
|   - [ Container HTML: Google Maps API ]             | <--- Seu JavaScript Customizado  
|   - [ <macros:Field id="Lat" /> ]                   | <--- Building Block (Lê do OData)  
|                                                     |  
| [ Section: Itens (Standard - RAP) ]                 |  
|   - Tabela de Voos                                  |  
-------------------------------------------------------
```

## Quando usar FPM? (Guia de Decisão)

| Cenário | Solução Recomendada | Motivo |
| :---- | :---- | :---- |
| `CRUD` simples de tabela | **Fiori Elements Padrão (RAP)** | Mais rápido, zero código JS. |
| Tabela com uma coluna de botão extra que chama API externa | **Fiori Elements + Custom Action** | Mantém a tabela padrão, adiciona só a lógica necessária. |
| Página com layout exótico (ex: Mapa interativo) | **Fiori Elements + Custom Section** | Isola o mapa numa seção, mantém o resto padrão. |
| Dashboard analítico complexo com interações não-padrão | **Freestyle UI5** (ou FPM Heavy) | O esforço de adaptar o padrão seria maior que fazer do zero. |

## Glossário Técnico

* **Flexible Programming Model (FPM):** Abordagem de arquitetura moderna para OData V4 que permite estender aplicações Fiori Elements utilizando componentes customizados (SAPUI5) de forma suportada e estável, sem perder os benefícios do padrão.  

* **Building Blocks (Macros):** Componentes de UI reutilizáveis (namespace sap.fe.macros) que encapsulam funcionalidades complexas do Fiori Elements (tabelas, formulários, filtros, gráficos) e podem ser usados dentro de views customizadas, mantendo a conexão com os metadados.  

* **Extension Point:** Locais pré-definidos e seguros na estrutura da página (cabeçalho, seções, tabelas, barras de ferramentas) onde o desenvolvedor pode inserir conteúdo customizado.  

* **Controller Extension:** Um arquivo JavaScript que estende o controlador padrão do Fiori Elements. Permite adicionar lógica de negócio customizada no frontend e interagir com a página padrão através da ExtensionAPI.  

* **ExtensionAPI:** Interface pública fornecida pelo Fiori Elements para que o código customizado interaja com o aplicativo padrão (ex: obter seleção, forçar refresh, navegar) sem acessar estruturas internas privadas.

## Quiz de Fixação

1. Qual é a principal vantagem de usar "Building Blocks" (Macros) dentro de uma seção customizada em vez de controles UI5 padrão (como sap.m.Table)?  
   R: Os Building Blocks são "guiados por metadados". Eles leem as anotações do serviço OData (como `@UI.lineItem`) e se configuram automaticamente. Isso significa que você não precisa definir colunas, tipos de dados ou lógica de filtro manualmente; você ganha uma tabela ou formulário Fiori Elements completo e funcional com uma linha de código XML, economizando tempo e garantindo consistência.  

2. Onde devemos configurar as extensões (como adicionar uma nova seção customizada) para evitar erros manuais complexos no arquivo manifest.json?  
   R: Devemos usar a ferramenta visual Page Map (parte das SAP Fiori Tools). Ela fornece uma interface gráfica para adicionar seções, colunas e ações, e gera automaticamente os arquivos e configurações JSON corretos no projeto.  

3. Se eu precisar executar um código JavaScript específico (ex: validar um dado chamando uma API REST externa) antes que o usuário consiga salvar o registro na Object Page, que recurso do FPM devo usar?  
   R: Devo usar uma Controller Extension e implementar/sobrescrever o método editFlow (especificamente ganchos como onBeforeSave). Isso permite interceptar o ciclo de vida transacional padrão do Fiori Elements e injetar lógica customizada de validação ou processamento.
