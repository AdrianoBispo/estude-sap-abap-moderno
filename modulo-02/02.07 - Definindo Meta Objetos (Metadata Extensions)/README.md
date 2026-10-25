# Definindo Meta Objetos (Metadata Extensions)

![Infográfico - As Vantagens da Metadata Extensions](./02.07_A_Vantagem_das_Metadatas_Extensions.png)

> **Comece pelos slides: [Definindo Meta Objetos (Metadata Extensions)](./02.07_Definindo_Meta_Objetos.pdf)**

## Objetivos de Aprendizagem

- Compreender e aplicar o princípio arquitetural da **Separação de Preocupações (Separation of Concerns)** no contexto do RAP, distinguindo claramente entre lógica de dados e lógica de apresentação.

- Configurar corretamente as CDS Views para aceitarem enriquecimento externo utilizando a anotação obrigatória `@Metadata.allowExtensions: true`, entendendo as implicações de performance e flexibilidade.
 
- Criar e vincular arquivos de **Metadata Extension (MDE)** para centralizar todas as anotações de UI (`@UI`), mantendo o código "Core" limpo e legível.

- Aplicar anotações fundamentais de UI, como `@UI.lineItem` e `@UI.selectionField`, dominando propriedades avançadas como importance, position e criticality para criar interfaces Fiori responsivas.

## 1. O Problema: Poluição Visual e Acoplamento no CDS

Nos exercícios anteriores, inserimos algumas anotações diretamente no arquivo .ddls da CDS View. Em exemplos pequenos, isso parece inofensivo. No entanto, em aplicações reais corporativas, uma única entidade de negócio (como "Ordem de Venda") pode ter dezenas ou centenas de campos.

Se para cada campo adicionarmos anotações de posição, rótulo, cor, filtros, ajuda de pesquisa e agrupamento, o arquivo da CDS View se tornará um monstro ilegível de milhares de linhas.

**Os Riscos do Acoplamento:**

1. **Dificuldade de Leitura:** A lógica SQL (Joins, Cases, Cálculos) fica enterrada sob camadas de metadados de UI. O desenvolvedor backend tem dificuldade em entender o modelo de dados.
 
2. **Rigidez:** Se você quiser reutilizar a mesma CDS View para dois aplicativos diferentes (um para Desktop com muitos campos, outro para Mobile simplificado), não consegue, pois as anotações de UI estão "chumbadas" (hardcoded) no código da view.

3. **Conflito de Manutenção:** Desenvolvedores focados em UI e desenvolvedores focados em Dados acabam editando o mesmo arquivo, gerando conflitos de versão.

## 2. A Solução: Metadata Extensions (MDE)

O modelo RAP resolve este problema adotando o padrão de **Metadata Extensions**. A ideia é mover todas as anotações que não são essenciais para o modelo de dados (ou seja, tudo que é `@UI`) para um objeto separado.

- **CDS View (.ddls):** O "Backend puro". Mantém a estrutura SQL, tipos de dados, associações e lógica de negócio (cálculos). É a "Verdade do Dado".

- **Metadata Extension (.ddlx):** O "Frontend semântico". Mantém as instruções de como esse dado deve ser apresentado na tela. É o "Estilo do Dado".

- **Analogia Web:** Pense na CDS View como o arquivo HTML (que define a estrutura e o conteúdo da página) e na Metadata Extension como o arquivo CSS (que define as cores, layout e visibilidade). Embora você possa escrever CSS dentro do HTML (inline), qualquer desenvolvedor experiente dirá que isso é uma má prática. O mesmo vale para o RAP.

## 3. Habilitando Extensões: O Contrato de Flexibilidade

Por padrão, uma CDS View é "fechada". O framework ignora arquivos de extensão de metadados, a menos que o autor da view declare explicitamente que ela permite ser estendida.

Para "abrir" a view, precisamos adicionar uma anotação de cabeçalho específica no arquivo .ddls:

``` CDS
@AccessControl.authorizationCheck: #CHECK  
@EndUserText.label: 'Consumption View for Travel'


/* A LINHA MÁGICA: */  

@Metadata.allowExtensions: true 

define view entity Z_C_TRAVEL   
  as select from Z_I_TRAVEL   

{ ... }
```

**Ponto de Atenção:** Se você criar o arquivo MDE, ativá-lo e o Fiori continuar mostrando a tela sem formatação, 90% das vezes o erro é ter esquecido de colocar `@Metadata.allowExtensions: true` na CDS View original. O framework falha silenciosamente (não dá erro), apenas ignora as extensões.

## 4. Criando a Metadata Extension na Prática

No ADT (Eclipse), criamos um objeto do tipo "Metadata Extension" (clique direito no Core Data Services > Metadata Extension). A sintaxe utiliza o comando `annotate entity` (ou o sinônimo `annotate view`), vinculando-se à entidade CDS. Toda Metadata Extension precisa declarar a anotação `@Metadata.layer`.

### Exemplo Prático: Configurando a Tela de Viagens

Vamos configurar nossa View de Consumo (`Z_C_TRAVEL`) para gerar um **List Report** (Relatório de Lista) profissional. Nossos objetivos de UI são:

1. **TravelID:** Deve ser a primeira coluna e também um filtro de pesquisa.  
2. **AgencyID:** Deve aparecer na lista com alta prioridade.  
3. **OverallStatus:** Deve ter destaque visual (cores) e prioridade máxima.

**Arquivo: `Z_C_TRAVEL.ddlx`**

``` CDS
@Metadata.layer: #CORE  

annotate entity Z_C_TRAVEL with  
{  
  /* ----------------------------------------------------------- */  
  /* Cabeçalho e Facetas (Estrutura da Página de Detalhes)       */  
  /* ----------------------------------------------------------- */  
  /* Define que a Object Page terá uma seção chamada "Detalhes"  */  
  /* exibindo os campos anotados com @UI.identification          */  

  @UI.facet: [ { id: 'Travel',   
                 purpose: #STANDARD,   
                 type: #IDENTIFICATION_REFERENCE,   
                 label: 'Detalhes da Viagem',   
                 position: 10 } ]

  /* ----------------------------------------------------------- */  
  /* Configuração Campo a Campo                                  */  
  /* ----------------------------------------------------------- */

  /* Campo: ID da Viagem */  
  /* lineItem: position 10 coloca na primeira coluna */  
  /* importance: #HIGH garante que nunca suma, mesmo em celulares */  
  /* selectionField: position 10 coloca como primeiro filtro no topo */  
  /* identification: posição do campo na seção "Detalhes" da Object Page */  
  @UI: {   
    lineItem:       [ { position: 10, importance: #HIGH } ],   
    selectionField: [ { position: 10 } ],   
    identification: [ { position: 10 } ]   
  }  
  TravelID;

  /* Campo: ID da Agência */  
  @UI: {   
    lineItem:       [ { position: 20, importance: #HIGH } ],   
    selectionField: [ { position: 20 } ],   
    identification: [ { position: 20 } ]   
  }  
  AgencyID;

  /* Campo: ID do Cliente */  
  /* importance: #MEDIUM significa que em telas pequenas, este campo pode ser ocultado */  
  @UI: {   
    lineItem:       [ { position: 30, importance: #MEDIUM } ],   
    selectionField: [ { position: 30 } ],   
    identification: [ { position: 30 } ]   
  }  
  CustomerID;

  /* Campo: Preço Total */  
  @UI.lineItem:   [ { position: 40 } ]  
  TotalPrice;

  /* Campo: Status (com criticalidade/cor) */  
  /* A propriedade 'criticality' aponta para outro campo da view que retorna 0,1,2,3 */  
  /* Isso fará o Status aparecer Verde/Amarelo/Vermelho automaticamente */  
  @UI.lineItem:   [ { position: 50, importance: #HIGH, criticality: 'StatusCriticality' } ]  
  OverallStatus;  
    
}
```

## 5. O Poder das Camadas (Layering)

Você deve ter notado a anotação `@Metadata.layer: #CORE` no início do arquivo. O SAP RAP implementa um sistema sofisticado de camadas para permitir que diferentes atores (SAP, Parceiros, Clientes) modifiquem a interface sem tocar no código um do outro.

**A ordem de prioridade (da menor para a maior) é:**

1. **`#CORE`:** A camada base. Geralmente onde o desenvolvedor da aplicação (você ou a SAP) define o layout padrão sugerido.
  
2. **`#LOCALIZATION`:** Usada para ajustes específicos de país (ex: mover o campo CEP para antes da Cidade no Brasil).

3. **`#INDUSTRY`:** Usada para soluções de indústria (ex: Oil & Gas precisa destacar campos diferentes de Varejo).

4. **`#PARTNER`:** Para parceiros que implementam e estendem a solução em clientes.

5. **`#CUSTOMER`:** A camada final. O cliente tem a palavra final. Se o cliente criar uma extensão nessa camada dizendo que o campo TotalPrice deve ficar oculto, essa configuração vence todas as anteriores.

* **Cenário de Exemplo:**
  
  * Na camada **`#CORE`**, definimos `AgencyID` na posição 20.  

  * Um parceiro cria uma extensão na camada **`#PARTNER`** e define `AgencyID` na posição 90.  

  * O usuário verá o campo na posição 90. O sistema faz o "merge" das anotações em tempo de execução, com a camada superior sobrescrevendo a inferior.

## Comparativo: Anotação Inline vs Externa

| Característica | Anotação Inline (Na View `.ddls`) | Metadata Extension (Externa `.ddlx`) |
| ----- | ----- | ----- |
| **Localização** | Misturada ao SQL na CDS View. | Em arquivo separado dedicado. |
| **Legibilidade** | Baixa. Polui a lógica de dados. | Alta. Focada apenas em UI. |
| **Flexibilidade** | Rígida. Alterar exige regenerar a view. | Flexível. Suporta camadas e variantes. |
| **Uso Recomendado** | Anotações técnicas/semânticas (`@Semantics`, `@EndUserText`) que definem o dado. | Anotações de UI (`@UI`) que definem a aparência. |

## Glossário Técnico

* **Metadata Extension (MDE):** Objeto de desenvolvimento ABAP (`.ddlx`) usado para separar anotações (principalmente de UI) da definição de dados. Permite enriquecer uma CDS View sem modificar seu código-fonte, facilitando upgrades e manutenção.

* **Separation of Concerns (Separação de Preocupações):** Princípio fundamental de arquitetura de software aplicado no RAP, onde o modelo de dados (CDS View) é mantido agnóstico de apresentação, enquanto a definição de layout e comportamento de UI é delegada para _Metadata Extensions_.

* **@Metadata.allowExtensions:** Anotação de cabeçalho booleana (true/false) que deve estar presente na CDS View para autorizar o framework a buscar e aplicar definições de arquivos MDE externos. Sem ela, as extensões são ignoradas.
 
* **Layer (Camada):** Propriedade que define a prioridade de aplicação de uma _Metadata Extension_. Permite que múltiplos arquivos de anotação existam para a mesma view, sendo aplicados em ordem hierárquica (`#CORE` -> `...` -> `#CUSTOMER`).

* **@UI Annotations:** Conjunto rico de anotações interpretadas pelo SAP Fiori Elements.

* Exemplos:  
  * `@UI.lineItem`: Controla colunas em tabelas.  
  * `@UI.selectionField`: Controla filtros na barra de pesquisa.  
  * `@UI.identification`: Controla campos em formulários de detalhe.  
  * `@UI.hidden`: Oculta campos técnicos (como UUIDs).

## Quiz de Fixação

1. O que acontece se eu criar um arquivo _Metadata Extension_ perfeito, com todas as colunas configuradas, mas esquecer de colocar `@Metadata.allowExtensions: true` na CDS View correspondente?  
  R: As anotações da extensão serão completamente ignoradas pelo framework em tempo de execução. A view funcionará e retornará dados, mas a interface de usuário (Fiori) será gerada "crua", sem as formatações, ordens e rótulos definidos na extensão, pois o sistema não carregará o arquivo MDE.

2. Por que dizemos que o uso de _Metadata Extensions_ promove o princípio de "Clean Code" no RAP?  
  R: Porque remove a "poluição" visual das anotações de UI de dentro da lógica de dados da CDS View. Isso torna a View mais fácil de ler, testar e dar manutenção, garantindo que cada artefato tenha uma responsabilidade única (Dados vs. Apresentação).

3. Se existir uma anotação na camada `#CORE` definindo a posição de um campo como 10, e uma anotação na camada `#CUSTOMER` definindo a posição do mesmo campo como 90, qual será usada na tela final?  
  R: A configuração da camada `#CUSTOMER` (posição 90) será usada. O sistema de camadas do RAP prioriza as definições do Cliente sobre as de Parceiros, e as de Parceiros sobre as do Core (SAP/Desenvolvedor Base), permitindo personalização sem modificação do código original.
