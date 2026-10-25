# Criando Tabelas de Banco de Dados (Source-Based)

![Infográfico - Modernizando Tabelas ABAP](./02.02_Modernizando_Tabelas_ABAP.png)

> **Comece pelos slides: [A Evolução da Modelagem de Dados no ABAP](./02.02_A_Evolucao_da_Modelagem_de_Dados_no_ABAP.pdf)**

## Objetivos de Aprendizagem

- Criar tabelas de banco de dados robustas utilizando a sintaxe baseada em código (**Dictionary DDL**) no ADT, abandonando as antigas telas gráficas da `SE11`.  

- Aplicar corretamente as anotações técnicas obrigatórias (`@AbapCatalog`, `@EndUserText`, `@Semantics`) para controlar o armazenamento, o transporte e o comportamento semântico da tabela.  

- Definir estratégias de chave primária modernas (UUIDs) e implementar campos administrativos padrão para auditoria automática no modelo RAP.  

- Compreender profundamente a diferença arquitetural entre usar **Data Elements** e **Tipos Primitivos**, decidindo qual utilizar com base nos requisitos de reutilização e internacionalização.

## 1. Adeus `SE11`, Olá Código Fonte

Durante décadas, a transação **`SE11` (ABAP Dictionary)** foi o coração da modelagem de dados no SAP. Desenvolvedores preenchiam formulários, navegavam entre abas ("Delivery and Maintenance", "Fields", "Currency/Quantity Fields") e clicavam em botões para ativar objetos.

No ABAP moderno (especialmente no **ABAP Cloud**), essa abordagem foi substituída pela **Source-Code Based Approach**. Isso significa que a definição de uma tabela agora é um artefato de texto puro, editável no Eclipse (ADT).

### Vantagens da Abordagem Baseada em Código:

* **Versionamento e Git:** Sendo um arquivo de texto, a definição da tabela pode ser facilmente versionada, comparada (diff) e mergeada utilizando ferramentas como **abapGit**.  
* **Velocidade e Produtividade:** Copiar e colar definições de campos, duplicar tabelas ou aplicar refatorações em massa (Find/Replace) é infinitamente mais rápido do que navegar por telas lentas do SAP GUI.  
* **Clareza:** Todas as configurações técnicas (que antes ficavam escondidas em popups e menus da `SE11`) agora estão explícitas no topo do arquivo como anotações.

## 2. Sintaxe de Definição de Tabela

Uma tabela no ADT começa com a instrução `DEFINE TABLE`. No entanto, o comportamento da tabela é ditado pelo bloco de anotações que a precede. Vamos dissecar cada parte.

### Anotações Técnicas (Header)

Estas anotações substituem as configurações de "Technical Settings" e "Delivery Class" da antiga `SE11`. Elas são obrigatórias.

* `@EndUserText.label`: Define a descrição curta da tabela. É o texto que aparece quando você pesquisa o objeto ou pressiona F1.  
* `@AbapCatalog.tableCategory`: Define se é uma tabela Transparente (`#TRANSPARENT`), Global Temporary, etc. Para persistência padrão, sempre usamos Transparente.  
* `@AbapCatalog.deliveryClass`: Define como os dados são tratados durante o transporte entre sistemas (DEV -> QAS -> PRD).  
  * `#A` (Application Table): Dados de negócio (Pedidos, Clientes). Geralmente não são transportados, são criados no ambiente.  
  * `#C` (Customizing Table): Dados de configuração. O conteúdo é registrado e transportado via Requests de Customizing.  
* `@AbapCatalog.dataMaintenance`: Controla se o conteúdo da tabela pode ser exibido/mantido por ferramentas genéricas (Data Preview do ADT, **SE16N**, **SM30**).  
  * `#RESTRICTED`: Permite exibição (ex: Data Preview no ADT), mas restringe a manutenção direta. É o valor gerado pelo template do ADT.  
  * `#NOT_ALLOWED`: Não permite exibição nem manutenção pelas ferramentas genéricas.  
  * Para tabelas RAP, `#RESTRICTED` ou `#NOT_ALLOWED` são recomendados: forçam o usuário a usar o App Fiori oficial para editar dados, garantindo que as validações do Business Object sejam executadas.

## 3. Campos e Tipos de Dados: A Escolha Arquitetural

Ao definir as colunas, o desenvolvedor tem duas opções. A escolha correta impacta a manutenibilidade e a qualidade da UI final.

### A. Data Elements (Recomendado para Negócio)

Refere-se a um objeto global do dicionário (ex: `/dmo/customer_id`).

* **Vantagem:** Herda automaticamente os Rótulos de Campo (Field Labels) traduzidos, a Ajuda de Pesquisa (`F4`) e a documentação `F1`.  
* **Resultado:** Quando você cria um App Fiori sobre essa tabela, a coluna já aparece com o nome correto ("Cliente") em todos os idiomas, sem esforço extra.

### B. Built-in Types (Tipos Primitivos)

Refere-se a tipos técnicos diretos (ex: `abap.char(10)`, `abap.int4`).

* **Uso:** Ideal para campos puramente técnicos (como UUIDs, Flags de controle interno, Timestamps) que nunca serão exibidos diretamente para o usuário final ou que não precisam de tradução.  

* **Desvantagem:** Se usado em campos de tela, o Fiori mostrará o nome técnico da coluna (ex: MY_COL), exigindo que você redefina o label manualmente em cada CDS View.

## 4. Exemplo Prático: Tabela de Viagens (Travel)

Vamos criar a tabela `zrap_travel`, que será a fundação do nosso aplicativo de gestão de viagens. Observe o uso estratégico de anotações semânticas e campos de auditoria.

``` CDS
@EndUserText.label : 'Tabela de Viagens - RAP Demo'  
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE  
@AbapCatalog.tableCategory : #TRANSPARENT  
@AbapCatalog.deliveryClass : #A  
@AbapCatalog.dataMaintenance : #RESTRICTED  
define table zrap_travel {

  // Chaves Primárias  
  key client      : abap.clnt not null;  
  key travel_uuid : sysuuid_x16 not null;

  // Campos de Dados (Usando Data Elements para semântica rica)  
  travel_id       : /dmo/travel_id;  
  agency_id       : /dmo/agency_id;  
  customer_id     : /dmo/customer_id;  
  begin_date      : /dmo/begin_date;  
  end_date        : /dmo/end_date;

  // Campos de Valor e Moeda (Ligação Semântica Obrigatória)  
  @Semantics.amount.currencyCode : 'zrap_travel.currency_code'  
  booking_fee     : /dmo/booking_fee;

  @Semantics.amount.currencyCode : 'zrap_travel.currency_code'  
  total_price     : /dmo/total_price;

  currency_code   : /dmo/currency_code;  
  description     : /dmo/description;  
  overall_status  : /dmo/overall_status;

  // Campos Administrativos (Audit Trail - Gerenciados pelo RAP)  
  created_by      : syuname;  
  created_at      : timestampl;  
  last_changed_by : syuname;  
  last_changed_at : timestampl;  
  local_last_changed_at : timestampl;
}
```

### Análise Detalhada do Código:

* **MANDT / Client:** O campo de mandante (`abap.clnt`) deve ser sempre o primeiro da chave. O banco de dados SAP isola logicamente os dados por mandante, e esquecer este campo torna a tabela "Client-Independent" (visível em todos os mandantes), o que raramente é desejado para dados de negócio.  

* **UUID como Chave (sysuuid_x16):** No desenvolvimento moderno RAP, preferimos usar UUIDs (Identificadores Únicos Universais) como chaves primárias técnicas em vez de números sequenciais semânticos (como TRAVEL_ID).  
  * *Por que?* Isso permite a criação de rascunhos (**Drafts**) e a numeração tardia (**Late Numbering**). O `travel_id` legível vira apenas um campo secundário de busca, enquanto o UUID garante a integridade referencial.  

* **Semântica de Moeda (@Semantics.amount...):** O SAP precisa saber que o número 100.00 no campo `total_price` se refere à moeda armazenada em `currency_code`. Sem essa anotação, o sistema não sabe se são 100 Dólares ou 100 Ienes (que não têm decimais), podendo exibir valores errados na UI.  

* **Campos de Auditoria:** Os campos `created_by`, `last_changed_at`, etc., não são apenas decorativos. O framework RAP Managed pode ser configurado para preencher esses campos automaticamente em cada operação de Create/Update, garantindo rastreabilidade sem que você precise escrever código para isso.

## Tabela de Decisão: Data Element vs Built-in Type

| Critério | Data Element (Ex: `/dmo/customer_id`) | Built-in Type (Ex: `abap.char(10)`) |
| ----- | ----- | ----- |
| **Reutilização** | Alta. O mesmo elemento é usado em tabelas, estruturas e assinaturas de métodos, garantindo consistência de tipo em todo o sistema. | Baixa. A definição é local e isolada. Se o tamanho mudar, precisa ser alterado em cada lugar manualmente. |
| **Semântica (UI)** | Automática. Traz consigo Textos Curtos, Médios, Longos e Cabeçalhos traduzidos para todas as línguas do sistema. | Manual. O campo não tem texto associado. O desenvolvedor deve redefinir o rótulo (@EndUserText.label) em cada CDS View que usar o campo. |
| **Ajuda de Pesquisa** | Integrada. Pode ter um Search Help anexado globalmente. | Nenhuma. Requer implementação manual de Value Helps. |
| **Uso Ideal** | Campos de Negócio visíveis ao usuário (Cliente, Material, Status, Data). | Campos Técnicos internos (UUIDs, Flags de controle, Timestamps de sistema). |

## Glossário Técnico

* **Delivery Class (Classe de Entrega):** Configuração crítica que define o comportamento de transporte da tabela. #A indica dados mestres ou transacionais (não transportáveis entre sistemas, apenas a estrutura vai). #C indica dados de configuração (customizing), onde o conteúdo da tabela é transportado.  

* **MANDT (Client):** Campo técnico obrigatório na maioria das tabelas SAP que atua como a primeira chave primária. Ele particiona os dados logicamente, permitindo que múltiplos clientes (empresas) compartilhem o mesmo sistema físico sem ver os dados uns dos outros.  

* **UUID (Universally Unique Identifier):** Um identificador de 128 bits (armazenado como RAW16) gerado por algoritmo que garante unicidade global. É a chave primária padrão no modelo de programação RAP para facilitar cenários *stateless* e rascunhos.  

* **Audit Fields (Campos Administrativos):** Conjunto padrão de campos (`created_by`, `created_at`, `last_changed_by`, `last_changed_at`) usados para rastrear o ciclo de vida do registro. No RAP, o preenchimento desses campos é frequentemente automatizado pelo framework.  

* **Semantic Annotations:** Anotações como `@Semantics.amount.currencyCode` que adicionam significado aos dados técnicos, permitindo que frameworks de UI (Fiori) e analíticos (BW/SAC) interpretem e formatem os valores corretamente (ex: posições decimais de moedas).

## Quiz de Fixação

1. Por que a chave primária técnica recomendada para novas tabelas no modelo RAP é um `UUID` (`sysuuid_x16`) em vez de um número sequencial semântico (como Número do Pedido)?  
  R: O uso de UUIDs facilita a implementação de cenários complexos como Drafts (Rascunhos), onde um registro precisa ser salvo temporariamente antes de estar validado e numerado oficialmente. O UUID permite que o registro exista tecnicamente com uma chave única desde o primeiro momento, enquanto o número semântico ("Pedido 100") pode ser gerado apenas no momento da gravação final (Late Numbering).

2. O que acontece se eu esquecer de adicionar a anotação `@Semantics.amount.currencyCode` ligando um campo de valor (price) ao seu campo de moeda (currency)?  
  R: O sistema tratará o valor como um número genérico. Isso pode causar erros graves de exibição em moedas que não usam 2 casas decimais (como o Iene Japonês ou Peso Chileno), fazendo com que o valor 100 seja exibido incorretamente ou arredondado de forma errada nas interfaces Fiori e relatórios.

3. Qual é a implicação de definir a anotação `@AbapCatalog.dataMaintenance` como `#RESTRICTED` ou `#NOT_ALLOWED`?  
  R: Isso bloqueia a edição direta dos dados da tabela através das ferramentas técnicas genéricas como SM30 (Table Maintenance Generator) e SE16N (com `#RESTRICTED` a exibição continua permitida; com `#NOT_ALLOWED`, nem a exibição). Isso é uma boa prática no modelo RAP, pois força os usuários e consultores a utilizarem os aplicativos Fiori construídos sobre a tabela, garantindo que todas as validações de negócio, autorizações e logs definidos no Business Object sejam respeitados.
