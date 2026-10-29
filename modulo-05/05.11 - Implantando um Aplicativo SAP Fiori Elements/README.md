# Implantando um Aplicativo SAP Fiori Elements

![Infográfico - Implantando um Aplicativo SAP Fiori Elements](./05.11_Do_Codigo_ao_Launchpad.png)

> **Comece pelos slides: [Deploy de um app Fiori elements](./05.11_Deploy_de_um_app_Fiori_elements.pptx)**
>
> Material complementar em PDF: [Guia Completo para o Deploy de Apps Fiori Elements no S/4HANA](./05.11_Fiori_Deploy_Do_Código_Ao_Usuário.pdf)
## Objetivos de Aprendizagem

- Compreender profundamente o ciclo de vida de **Deployment** (Implantação), transformando um projeto de desenvolvimento local em um artefato de produção hospedado no servidor ABAP.  

- Utilizar as **SAP Fiori Tools** para executar o processo de build e deploy, compreendendo o papel dos arquivos de configuração `ui5-deploy.yaml`.  

- Diferenciar com precisão arquitetural os **Catálogos Técnicos** (Repositório de Definições) dos **Catálogos de Negócio** (Agrupamento de Funções), e como eles se relacionam com o Fiori Launchpad.  

- Configurar a visualização e o comportamento do aplicativo no **SAP Fiori Launchpad**, definindo Tiles estáticos/dinâmicos e Mapeamentos de Destino (Target Mappings) baseados em intenção.  

- Gerenciar o acesso ao aplicativo através do modelo **IAM (Identity and Access Management)**, atribuindo catálogos a Roles de Negócio e usuários.

## 1. O Que Significa "Fazer Deploy"?

Durante as aulas anteriores, seu aplicativo Fiori rodou em um "ambiente protegido" localmente no VS Code ou Business Application Studio (BAS). Ele usava um servidor Node.js local para servir os arquivos HTML/JS e um proxy para buscar dados do SAP.

Para que os usuários finais (gerentes, auditores, vendedores) acessem o app, o código fonte precisa sair da sua máquina e residir no servidor SAP, onde a segurança e a escalabilidade são gerenciadas.

A Aplicação BSP (Business Server Page):  
No contexto do SAP S/4HANA (seja On-Premise ou ABAP Cloud), os aplicativos web estáticos (HTML, CSS, JavaScript, XML) são armazenados dentro de um contêiner técnico chamado BSP Application.

* O deploy não envia os arquivos "crus". Ele envia uma versão otimizada (minificada) e compactada.  
* Uma vez no servidor, o aplicativo ganha uma URL oficial e um nó no serviço ICF (Internet Communication Framework), tornando-se acessível via navegador na intranet ou internet segura da empresa.

## 2. O Processo de Deploy (Via Fiori Tools)

Antigamente, fazer o upload de um app Fiori envolvia relatórios ABAP manuais (`/UI5/UI5_REPOSITORY_LOAD`). Hoje, as **SAP Fiori Tools** automatizam todo o pipeline de CI/CD (Integração e Entrega Contínuas) diretamente da sua IDE.

### O Arquivo de Configuração (`ui5-deploy.yaml`)

Quando você executa o assistente de deploy pela primeira vez, ele gera um arquivo ui5-deploy.yaml. Este arquivo é o "mapa" do deploy. Ele diz ao sistema:

* Qual é o sistema de destino (URL, Cliente).  
* Qual o nome do pacote ABAP (`$TMP` ou `Z_PACKAGE`).  
* Qual o nome técnico do App (`Z_MY_APP`).

### Passos Detalhados do Assistente "Deploy Application":

1. **Target System (Conexão):** Você seleciona o sistema S/4HANA de destino. A ferramenta usa suas credenciais para autenticar e verificar permissões.  

2. **App Details (Metadados ABAP):**  
   * **Name:** O nome técnico da aplicação BSP (ex: `z_travel_app`). Deve ser único no sistema e seguir convenções de nomenclatura (geralmente até 15 caracteres).  
   * **Description:** Descrição visível na transação `SE80`.  
   * **Package:** O Pacote ABAP de destino. Se for `$TMP`, é um objeto local (não transportável). Se for um pacote produtivo (ex: `Z_MAIN`), o sistema exigirá uma **Transport Request**.  
   * **Transport Request (TR):** O "container de remessa" que levará seu aplicativo do ambiente de Desenvolvimento para Qualidade e Produção. O assistente pode criar uma nova TR ou usar uma existente.  

3. **Execução (Build & Upload):**  
   * **Build:** O comando npm run build é executado nos bastidores. Ele cria uma pasta dist/ contendo o arquivo `Component-preload.js` (todos os seus arquivos JS compactados em um só para performance).  
   * **Upload:** O conteúdo da pasta dist/ é enviado para o repositório ABAP.  
   * **Registro:** O serviço ICF é ativado e o cache de UI5 do servidor é invalidado para que a nova versão apareça imediatamente.

## 3. Integração com o Fiori Launchpad (FLP)

Fazer o deploy coloca o código no servidor, mas o aplicativo ainda é "invisível". Ele não tem um ícone (Tile) no Launchpad. Para consertar isso, precisamos configurar os metadados de navegação.

A configuração no S/4HANA moderno segue uma hierarquia de dois níveis para maximizar a reutilização:

### A. Technical Catalog (Catálogo Técnico)

Pense nisso como um "Armazém de Peças". É onde o desenvolvedor define *o que* o aplicativo é.

* **Target Mapping (Mapeamento de Destino):** É a regra de roteamento.  
  * *Semantic Object:* Travel  
  * *Action:* manage  
  * *App ID:* Aponta para o seu app BSP `z_travel_app`.  
  * *Significado:* "Sempre que alguém quiser 'Gerenciar Viagens', use este código fonte".  

* **Tile (Bloco):** É a representação visual.  
  * *Título:* "Gerenciar Viagens"  
  * *Ícone:* `sap-icon://travel-itinerary`  
  * *Parâmetros:* Pode ser estático ou dinâmico (mostrando um número contador, ex: "5 Viagens Pendentes").

### B. Business Catalog (Catálogo de Negócio)

Pense nisso como o "Menu do Restaurante". É onde o consultor funcional ou arquiteto define *quem* vê o quê.

* Você não cria Tiles aqui. Você **referencia** Tiles do Catálogo Técnico.  
* Um Business Catalog agrupa funções que fazem sentido para uma pessoa (ex: "Catálogo de Gestão de Viagens", que contém o Tile de "Criar", "Aprovar" e "Relatórios").  
* É este objeto que será atribuído à segurança (Roles).

## 4. IAM: Dando Acesso ao Usuário

No modelo **ABAP Cloud** (S/4HANA Cloud e BTP), o acesso não é mais gerenciado via perfis técnicos complexos (PFCG manual). Usamos o conceito simplificado de IAM (Identity and Access Management).

1. **Business Role (Papel de Negócio):**  
   * Cria-se um papel que representa uma função de trabalho na empresa (ex: Z_TRAVEL_MANAGER_ROLE).  
   * Esta role pode ser derivada de templates padrão da SAP para herdar permissões básicas.  

2. **Atribuição de Catálogo:**  
   * Adiciona-se o **Business Catalog** criado no passo anterior a esta Business Role.  
   * Ao fazer isso, a Role herda automaticamente o acesso aos serviços OData (IWSG) e aplicativos BSP contidos no catálogo. Não é necessário adicionar objetos de autorização manualmente.  

3. **Usuário de Negócio:**  
   * Finalmente, atribui-se a Business Role ao usuário final (Employee).  
   * Quando o usuário fizer login no Fiori Launchpad, o sistema verificará suas Roles, encontrará os Catálogos e renderizará os Tiles correspondentes.

Fluxo Completo de Segurança: Usuário -> possui Business Role -> agrupa Business Catalog -> referencia Technical Catalog -> aponta para BSP App & OData Service.

## 5. Resumo Visual do Deploy

Visualize o caminho que seu código percorre desde o seu teclado até a tela do usuário final:

```
[ 1. Ambiente de Desenvolvimento (Local/Cloud) ]  
      |  
      | (Processo de Build: Minificação & Preload)  
      v  
[ 2. Pacote de Deploy (Arquivo .zip / pasta dist) ]  
      |  
      | (Upload via Fiori Tools / OData Service de Deploy)  
      v  
[ 3. Repositório ABAP (Backend S/4HANA) ]  
      |-- BSP Application (Código Fonte Web)  
      |-- SICF Service (Endpoint HTTP)  
      |  
      ^ (Referenciado por)  
      |  
[ 4. Camada de Configuração FLP ]  
      |-- Technical Catalog (Define Tile + Target Mapping)  
      |-- Business Catalog (Agrupa Tiles para Funções)  
      |  
      ^ (Atribuído a)  
      |  
[ 5. Gestão de Identidade (IAM) ]  
      |-- Business Role (Papel: Gerente de Viagens)  
      |-- Business User (Usuário: João Silva)
```

### Check-list de Deploy (Antes de enviar)

1. **Teste Local:** O app roda sem erros (npm start) e consome dados reais?  
2. **Configuração YAML:** O ui5-deploy.yaml aponta para o sistema e pacote corretos?  
3. **Transporte:** Você tem uma Transport Request aberta e modificável no sistema ABAP para o pacote de destino?  
4. **Nomenclatura:** O nome do app BSP (z...) é único, segue o padrão da empresa e respeita o limite de 15 caracteres?  
5. **Limpeza:** Você removeu código morto ou comentários de debug antes do build?

## Glossário Técnico

* **BSP Application (Business Server Pages):** Formato técnico de contêiner usado para armazenar recursos web estáticos (HTML5, CSS, JS) dentro do banco de dados do servidor de aplicação ABAP. É a "hospedagem" do app Fiori no On-Premise/Cloud.  

* **Transport Request (Ordem de Transporte):** Mecanismo de ciclo de vida da SAP (ALM). É um "pacote de remessa" numerado que agrupa objetos alterados (Classes, CDS, BSP Apps) para movê-los de forma consistente do ambiente de Desenvolvimento para Testes e Produção.  

* **Technical Catalog:** Objeto de design do Launchpad focado na definição técnica (DRY - Don't Repeat Yourself). Contém os Tiles e Target Mappings originais. Mudanças aqui refletem em todos os catálogos de negócio que o referenciam.  

* **Business Catalog:** Objeto de design do Launchpad focado na função do usuário. É uma coleção de referências a Tiles de catálogos técnicos, montada para atender a um perfil de trabalho específico.  

* **IAM (Identity and Access Management):** Framework de segurança moderno do SAP S/4HANA Cloud que abstrai a complexidade da transação PFCG, focando na atribuição de Catálogos de Negócio a Funções de Negócio.  

* **Component-preload.js:** Arquivo gerado durante o build que contém todo o código JavaScript da aplicação em um único arquivo compactado, essencial para reduzir o tempo de carregamento inicial do app.

## Quiz de Fixação

1. Onde o código fonte do aplicativo Fiori (HTML/JS) fica armazenado fisicamente após o deploy no sistema S/4HANA e como ele chega lá?
  R: Ele é armazenado no Repositório ABAP como uma BSP Application. Ele chega lá através das SAP Fiori Tools, que realizam o build (otimização) do projeto local e fazem o upload dos arquivos para o servidor via serviço OData de deploy.  

2. Qual a diferença fundamental de propósito entre um Catálogo Técnico e um Catálogo de Negócio?
  R: O Catálogo Técnico é um repositório de definições técnicas (Tiles e Mapeamentos), criado para evitar duplicação e facilitar a manutenção técnica. O Catálogo de Negócio é uma coleção lógica dessas definições, organizada para atender às necessidades de uma função específica (Role) na empresa e é o objeto usado para atribuição de segurança.  

3. Para que um usuário final veja o Tile do seu aplicativo no Launchpad e consiga abri-lo, quais objetos precisam ser encadeados corretamente?
  R: O aplicativo (BSP/Target Mapping) deve estar definido em um Catálogo Técnico. Este deve ser referenciado em um Catálogo de Negócio. O Catálogo de Negócio deve ser adicionado a uma Business Role. Finalmente, essa Role deve estar atribuída ao Usuário no sistema IAM.
