# Explorando a Modelagem de Dados no ABAP

![Infográfico - A Evolução da Modelagem de Dados no ABAP](./02.01_A_Evolucao_da_Modelagem_de_Dados_ABAP.png)

> **Comece pelos slides: [A Revolução Silenciosa da Modelagem de Dados no S/4HANA ](./02.01_CDS_VDM_S4HANA_Architecture.pdf)**
>
> **Referência oficial (ABAP Keyword Documentation):** [ABAP Dictionary (DDIC)](https://help.sap.com/docs/abap-cloud/abap-keywords/abap-dictionary-ddic)

## Objetivos de Aprendizagem

- Diferenciar tecnicamente e arquiteturalmente o papel do **ABAP Dictionary Clássico** (SE11) do **ABAP Core Data Services (CDS)** no ecossistema moderno.  
- Compreender e justificar a necessidade do paradigma **Code Pushdown** (Levar o código até os dados) no contexto do banco de dados em memória SAP HANA.  
- Dominar o conceito de **Virtual Data Model (VDM)**, identificando e aplicando corretamente suas camadas: **Basic** (Interface), **Composite** e **Consumption** (Projection).  
- Identificar por que as CDS Views são o alicerce insubstituível do S/4HANA, suportando desde a analítica em tempo real até o modelo transacional RAP.

## 1. A Evolução: Do Dicionário ao CDS

No passado, durante a era do SAP ECC (ERP Central Component), a modelagem de dados acontecia quase inteiramente na transação **SE11 (ABAP Dictionary)**. O processo era focado na estrutura física e relacionamentos simples:

* **Tabelas Transparentes:** Definiam o armazenamento físico.  
* **Database Views:** Realizavam junções simples (Inner Joins) entre tabelas.  
* **Limitações:** As views da SE11 não suportavam cálculos, agregações, parâmetros ou lógica condicional (CASE).

### Desafios da Abordagem Clássica (Data-to-Code)

Toda a inteligência residia no servidor de aplicação (ABAP). Para calcular o "Total de Vendas por Cliente", o programa precisava:

1. Selecionar milhões de linhas de itens de venda do banco.  
2. Transferir esses dados pela rede até o servidor de aplicação.  
3. Armazenar em tabelas internas gigantes (consumindo memória RAM).  
4. Fazer loops para somar e agrupar os valores.  
   Resultado: Ineficiência extrema em grandes volumes de dados.

**A Solução (ABAP CDS):** Com a chegada do SAP HANA, foi necessário criar uma linguagem que explorasse o poder do banco. O Core Data Services (CDS) é uma infraestrutura de modelagem de dados de "próxima geração" (DDL avançada). Ele permite definir modelos de dados semanticamente ricos diretamente no banco de dados, não apenas no servidor de aplicação. Uma CDS View não é apenas uma "View SQL"; é uma entidade que suporta associações, anotações de metadados, controle de acesso (DCL) e lógica de negócio.

## 2. O Paradigma "Code-to-Data" (Code Pushdown)

A mudança para o SAP HANA inverteu a lógica de desenvolvimento. O banco de dados deixou de ser apenas um "arquivo passivo" para se tornar um "motor de cálculo".

* **Data-to-Code (Antigo):** "Traga os dados até o código".  
  * *Fluxo:* Banco -> Rede -> ABAP (Processamento) -> Tela.  
  * *Gargalo:* Latência de rede e memória do servidor ABAP.  
* **Code-to-Data (Novo):** "Empurre a lógica para os dados".  
  * *Fluxo:* O ABAP envia a instrução complexa -> O HANA processa, filtra, agrega e calcula -> O HANA devolve apenas o resultado final (pequeno) -> ABAP -> Tela.  
  * *Vantagem:* Performance massiva. Operações que levavam horas agora levam segundos.

As **CDS Views** são o veículo principal para realizar o Code Pushdown no ABAP moderno. Elas encapsulam o SQL complexo que roda no HANA, expondo uma interface simples para o ABAP.

## 3. ABAP Dictionary vs. ABAP CDS: Quem faz o quê?

Mesmo no ABAP Cloud, o Dicionário de Dados não morreu, mas seu papel mudou drasticamente. Ele voltou a ser responsável apenas pela definição física e tipagem básica.

| Artefato | Ferramenta / Local | Função no Modelo Moderno |
| ----- | ----- | ----- |
| Tabela de Banco de Dados | ABAP Dictionary (via ADT) | Armazenamento Físico (Persistência). Onde os dados realmente moram. Define chaves e tipos técnicos. |
| Elemento de Dados / Domínio | ABAP Dictionary | Semântica Técnica. Define tipos reutilizáveis, labels (rótulos de tela) e ajudas de pesquisa técnicas. |
| Views (Visões) | ABAP CDS (Eclipse) | Modelagem Lógica. Lógica de leitura, Joins, Associações (ASSOCIATION), Cálculos (CASE, Aritmética), Agregações (SUM, MAX) e Segurança. Substitui as Views da SE11. |
| Search Helps | ABAP CDS | Listas de Valores Inteligentes. Search Helps baseados em CDS são mais flexíveis e performáticos que os clássicos da SE11. |

**Regra Prática:** Use o Dictionary (Code-Based no ADT) para criar a *tabela física*. Use CDS para *todo o resto* (ler, transformar, expor, calcular).

## 4. O Virtual Data Model (VDM)

No S/4HANA e no RAP, desencorajamos o acesso direto a tabelas físicas (como VBAK, MARA) nas aplicações. Em vez disso, construímos uma hierarquia de CDS Views chamada **VDM (Virtual Data Model)**. Isso cria uma camada de abstração que protege a aplicação de mudanças físicas no banco.

### As 3 Camadas do VDM:

1. **Basic / Interface Views (Camada de Base):**  
   * **Função:** Espelhar os dados brutos da tabela física, mas com nomes limpos e semânticos. É a "fonte da verdade".  
   * **Características:** Acessam diretamente a tabela do banco. Normalizam nomes (ex: MATNR vira Material). Não devem ter filtros restritivos (como WHERE Plant = '1000') para garantir reutilização máxima.  
   * **Nomenclatura Padrão:** I_NomeDaEntidade (ex: I_Product, I_SalesOrder).  
   * **Anotação:** @VDM.viewType: #BASIC  

2. **Composite Views (Camada de Composição):**  
   * **Função:** Combinar Interface Views para formar cubos de dados ou visões de negócio mais ricas.  
   * **Características:** Faz Joins e Associações entre Interface Views. Contém a lógica de negócio reutilizável (ex: "Buscar Cliente com Endereço e Dados Bancários"). É a base para a analítica.  
   * **Nomenclatura Padrão:** I_NomeComposto (ex: I_SalesOrderWithCustomer).  
   * **Anotação:** @VDM.viewType: #COMPOSITE  

3. **Consumption / Projection Views (Camada de Consumo):**  
   * **Função:** Atender a uma necessidade específica de uma tela (UI) ou API.  
   * **Características:** É a "ponta do iceberg". Filtra apenas os campos que o App Fiori precisa. Contém anotações de UI (@UI), rótulos específicos e parâmetros de pesquisa.  
   * **Nomenclatura Padrão:** C_NomeEspecifico (ex: C_SalesOrderAnalytics, C_ApproveTravel).  
   * **Anotação:** @VDM.viewType: #CONSUMPTION

## 5. Exemplo Conceitual de VDM (Cenário de Vendas)

Para visualizar como isso se aplica na prática, imagine que estamos construindo um relatório de vendas:

* **Tabela Física:** ZTB_SALES (Colunas Técnicas: ID, AMT, CUR, CUST_ID). Dados brutos e incompreensíveis.  
* **Interface View (I_Sales):** Lê ZTB_SALES. Define que AMT é um valor monetário ligado a CUR. Renomeia CUST_ID para CustomerID. Define associação com a view de cliente.  
* **Composite View (I_SalesWithCustomer):** Faz a associação de I_Sales com I_Customer. Calcula o total de vendas por região do cliente. Adiciona textos descritivos.  
* **Consumption View (C_SalesReport_App):** Seleciona os dados da Composite. Adiciona anotações para dizer que a "Região" é um filtro e o "Total" é um gráfico de barras. Esta é a view exposta via OData.

## Pontos de Atenção (Arquitetura VDM)

| Camada VDM | Objetivo Principal | Reutilização | Pode ser acessada por SQL externo? |
| ----- | ----- | ----- | ----- |
| Interface (Basic) | Normalização e Semântica Básica. Espelho limpo do banco. | Alta (Base para tudo). | Sim (por outras views e ABAP). |
| Composite | Combinação de dados e lógica de negócio centralizada. | Média (Base para vários apps). | Sim. |
| Consumption | Específica para um cenário (Tela/Relatório/API). Projeção final. | Baixa (Específica do App). | Não recomendado (deve ser consumida via OData/InA). |

## Glossário Técnico

* **ABAP CDS (Core Data Services):** Linguagem de definição de dados (DDL) avançada e independente de plataforma (embora otimizada para HANA) que permite criar modelos de dados semanticamente ricos e executar lógica complexa (Code Pushdown) no nível do banco de dados.  

* **Code Pushdown:** Técnica fundamental de otimização de performance no ecossistema SAP HANA. Consiste em delegar operações intensivas de dados (agregações, filtros, cálculos) para a camada de banco de dados, minimizando a transferência de dados e o uso de CPU no servidor de aplicação.  

* **VDM (Virtual Data Model):** Uma representação estruturada, hierárquica e abstrata dos dados de negócio do S/4HANA. Composto inteiramente por CDS Views, ele isola a complexidade das tabelas físicas e fornece visões de negócio prontas para consumo (Interface, Composite, Consumption).  

* **SE11:** Código de transação do SAP GUI para o ABAP Dictionary clássico. No desenvolvimento moderno, seu uso é restrito à definição de tabelas físicas e tipos globais, sendo obsoleta para a criação de Views lógicas.  

* **ADT (ABAP Development Tools):** A IDE baseada em Eclipse onde as CDS Views *devem* ser criadas. O SAP GUI não possui editor para CDS, tornando o ADT obrigatório para qualquer desenvolvimento S/4HANA ou RAP.

## Quiz de Fixação

1. Qual é o principal objetivo do paradigma "Code Pushdown"?
   R: Melhorar drasticamente a performance das aplicações movendo a lógica de processamento intenso de dados (como agregações, cálculos complexos e filtros de grande volume) da camada de aplicação (ABAP) para a camada de banco de dados (HANA), aproveitando o processamento paralelo em memória.
  
2. No desenvolvimento ABAP Moderno, onde devemos criar as Views de banco de dados? Na transação SE11 ou via CDS no ADT?
   R: Via CDS no ADT (Eclipse). A criação de Views pela SE11 é considerada obsoleta para novos desenvolvimentos no S/4HANA, pois o CDS oferece recursos semânticos (anotações), associações e otimizações de execução muito superiores que as views clássicas não suportam.

3. Explique a função da camada "Consumption View" (ou Projection View) na hierarquia VDM.
   R: É a camada mais alta da hierarquia, projetada especificamente para atender aos requisitos de uma interface de usuário (UI) ou API específica. Ela projeta (seleciona) um subconjunto dos dados das camadas inferiores, adiciona metadados específicos de apresentação (UI Annotations) e não deve ser reutilizada por outras views para evitar acoplamento de interface.
