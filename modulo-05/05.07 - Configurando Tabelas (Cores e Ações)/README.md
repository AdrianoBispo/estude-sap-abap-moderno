# Configurando Tabelas (Cores e Ações)

![Infográfico - Guia Rápido: Tabelas Dinâmicas no Fiori Elements](./05.07_Tabelas_Dinamicas_no_Fiori_Elements.png)

> **Comece pelos slides: [Tabelas: cores, ações e responsividade](./05.07_Tabelas_cores_ações_e_responsividade.pptx)**
>
> Material complementar em PDF: [Anatomia de Uma Tabela Inteligente em Fiori Elements](./05.07_Anatomia_da_Tabela_Fiori_Inteligente.pdf)
## Objetivos de Aprendizagem

- Implementar **Criticality** (Cores Semânticas) para destacar colunas de status, compreendendo como mapear valores numéricos do backend para feedback visual no frontend.  

- Adicionar **Botões de Ação** na tabela (`DataFieldForAction`), distinguindo entre ações globais (Toolbar) e ações específicas de linha (Inline).  

- Gerenciar a visibilidade de botões padrão (**Create**, **Delete**, **Update**) via anotações de UI, independentemente das capacidades do backend.  

- Configurar a **Responsividade** da tabela usando a propriedade importance, garantindo uma experiência de usuário fluida em dispositivos móveis e desktops.

## 1. Dando Cor aos Dados: Criticality

Em aplicações corporativas, os usuários frequentemente precisam processar grandes listas de dados rapidamente. Uma tabela monótona cheia de texto preto e branco dificulta a identificação de problemas. O SAP Fiori utiliza o conceito de **Criticality** (Criticidade) para adicionar uma camada semântica visual aos dados.

Não escolhemos cores arbitrárias (como "Azul #0000FF"); usamos **Cores Semânticas** que transmitem significado universal:

* **3 (Verde - Positive):** Sucesso, Aprovado, Concluído, Dentro do Prazo.  
* **2 (Amarelo - Critical):** Aviso, Em Atenção, Pendente, Quase Vencendo.  
* **1 (Vermelho - Negative):** Erro, Rejeitado, Atrasado, Bloqueado.  
* **0 (Cinza - Neutral):** Informativo, Inativo, Rascunho, Sem Status.

### Passo 1: O Campo Calculado (Backend)

A lógica de decisão ("Este registro é crítico?") deve residir no Backend (CDS View), não no Frontend. Criamos um campo calculado, geralmente nomeado como `StatusCriticality`, que retorna os inteiros 0, 1, 2 ou 3.

``` CDS
/* Exemplo na CDS View */  
case status_pedido  
  when 'FINALIZADO'           then 3  -- Finalizado = Verde  
  when 'CANCELADO'            then 1  -- Cancelado = Vermelho  
  when 'AGUARDANDO_APROVACAO' then 2  -- Aguardando aprovação = Amarelo  
  else 0                              -- Aberto e outros = Cinza  
end as StatusPedidoCriticality
```

### Passo 2: A Anotação (Metadata Extension)

Na Metadata Extension, vinculamos a coluna visual ao campo de cálculo técnico.

``` CDS
/* Na coluna StatusPedido */  
@UI.lineItem: [   
  {   
    position: 40,   
    label: 'Status do pedido',  
      
    /* Vínculo Mágico: O Fiori lê o valor deste campo para colorir o valor da coluna (não a linha inteira) */  
    criticality: 'StatusPedidoCriticality',   
      
    /* Opcional: Adiciona ícone além da cor (Check, X, Exclamação) */  
    /* Recomendado para Acessibilidade (Daltônicos) */  
    criticalityRepresentation: #WITH_ICON   
  }   

]  
StatusPedido;
```

**Resultado:** Se o status for 'FINALIZADO', o campo StatusPedidoCriticality será 3. O Fiori pintará o texto "Finalizado" de verde e adicionará um ícone de "check" ao lado.

> **No projeto [Pedidos de Compras](https://github.com/AdrianoBispo/sap-abap-rap-pedidos-de-compras-app):** em vez do `case`, o valor 0–3 de cada status fica na lista de códigos `ZTA_PC_CODELIST`, e a projeção o lê pela associação: `_StatusPedidoTxt.Criticality as StatusPedidoCriticality`. Mudar uma cor passa a ser um ajuste de dados, não de código.

## 2. Botões de Ação na Tabela

Uma tabela moderna não serve apenas para leitura; ela é um ponto de partida para ações. No Fiori Elements, as ações podem aparecer em dois lugares principais: na **Barra de Ferramentas (Toolbar)** ou dentro de cada **Linha (Inline)**.

### A. Ações Padrão (C.R.U.D.)

O framework gera automaticamente os botões **Create** (Criar) e **Delete** (Excluir) baseando-se nas capacidades do seu **Behavior Definition (`BDEF`)**.

* Se o `BDEF` diz `create;`, o botão "Criar" aparece.  
* Se o `BDEF` diz `delete;`, o botão "Excluir" aparece (ativado ao selecionar linhas).

Controle via UI: Às vezes, o backend permite deletar (tecnicamente), mas queremos esconder o botão na tela principal por regra de negócio ou usabilidade.  
Usamos anotações de cabeçalho:

* `@UI.createHidden: true ` (Esconde o botão "Criar" na tela principal)
* `@UI.deleteHidden: true ` (Esconde o botão "Excluir" na tela principal)
* `@UI.updateHidden: true` (Esconde o botão "Editar" na Object Page).

### B. Ações Customizadas (Botões de Negócio)

Para ações específicas como "Aprovar pedido" ou "Cancelar pedido", usamos a anotação `#FOR_ACTION`.

#### Tipos de Posicionamento

1. **Toolbar Action:** Botão no topo da tabela. Ideal para ações em massa ou que afetam múltiplos registros selecionados. (Padrão se não especificado o contrário).  

2. **Inline Action:** Botão pequeno dentro da própria linha. Ideal para ações rápidas em um único registro. Configurado com a propriedade `inline: true` no item `#FOR_ACTION`. (Não confunda com `invocationGrouping`, que define se a ação é executada de forma isolada ou em conjunto quando várias linhas estão selecionadas.)

``` CDS
@UI.lineItem: [  
  /* Coluna de Dados Normal */  
  { position: 10, label: 'Pedido' },

  /* Ação na Toolbar: Aprovar */  
  /* Requer seleção de uma ou mais linhas */  
  {   
    type: #FOR_ACTION,   
    dataAction: 'AprovarPedido',  /* Nome exato da ação no BDEF */  
    label: 'Aprovar pedido',  
    position: 15   
  },  
    
  /* Ação Inline: Cancelar */  
  /* inline: true faz o botão aparecer dentro de cada linha */  
  {   
    type: #FOR_ACTION,   
    dataAction: 'CancelarPedido',   
    label: 'Cancelar',  
    inline: true,  
    position: 16   
  }  

]  
NumeroPedido;
```

## 3. Responsividade e Importância

O Fiori Elements segue a filosofia "Mobile First". Mas o que acontece quando uma tabela com 20 colunas é aberta em um iPhone?

O framework usa a propriedade importance para decidir o destino de cada coluna:

* **#HIGH:** A coluna é sagrada. Ela sempre permanece visível, não importa quão pequena seja a tela. Use para chaves (ID) e status críticos.  
* **#MEDIUM:** A coluna é importante, mas secundária. Em tablets, ela aparece. Em celulares, ela é removida da tabela e movida para uma área de detalhes expansível (Pop-in).  
* **#LOW:** A coluna é detalhe. Só aparece em monitores Desktop grandes. Em telas menores, ela vai para o Pop-in ou é ocultada.

**O Conceito de "Pop-in":** Quando uma coluna é escondida por falta de espaço, o Fiori não apaga os dados. Ele cria uma seta na linha que, ao ser clicada, expande a linha para baixo mostrando os campos ocultos em formato de lista (Label: Valor).

``` CDS
/* Observação é longa, então só mostramos em telas grandes */  
@UI.lineItem: [ { position: 90, importance: #LOW } ]  
Observacao;
```

## 4. Exemplo Prático Completo

Vamos configurar a tabela de pedidos do projeto [Pedidos de Compras](https://github.com/AdrianoBispo/sap-abap-rap-pedidos-de-compras-app), com cores, ícones e as ações do ciclo de vida do pedido (versão simplificada da Metadata Extension real).

``` CDS
@Metadata.layer: #CORE  
annotate entity ZC_PC_PEDIDO_APP with  
{  
  /* --- AÇÕES E COLUNA CHAVE --- */  

  @UI.lineItem: [   
    /* Coluna Número: Sempre visível (#HIGH) */  
    { position: 10, label: 'Pedido', importance: #HIGH },  

    /* Menu "Ações" na toolbar, agrupando as ações do pedido */  
    { type: #FOR_ACTION_GROUP, actionGroupId: 'AcoesPedido', label: 'Ações', position: 100 },  
    { type: #FOR_ACTION, dataAction: 'SimularPagamento', label: 'Efetuar Pagamento',  
      actionGroupId: 'AcoesPedido', position: 10 },  
    { type: #FOR_ACTION, dataAction: 'AprovarPedido',    label: 'Aprovar pedido',  
      actionGroupId: 'AcoesPedido', position: 20 },  
    { type: #FOR_ACTION, dataAction: 'CancelarPedido',   label: 'Cancelar pedido',  
      actionGroupId: 'AcoesPedido', position: 30 },  

    /* Ação estática (não depende de linha selecionada) */  
    { type: #FOR_ACTION, dataAction: 'ImportarPlanilha', label: 'Importar planilha' }  
  ]  
  NumeroPedido;

  /* --- DADOS SECUNDÁRIOS --- */  
  @UI.lineItem: [ { position: 20, label: 'CPF' } ]  
  CpfCliente;

  @UI.lineItem: [ { position: 30, label: 'Cliente', importance: #HIGH } ]  
  NomeCliente;

  @UI.lineItem: [ { position: 70, label: 'Data do pedido' } ]  
  CreatedAt;

  /* --- STATUS COLORIDO --- */  
  /* Criticality aponta para StatusPedidoCriticality (0-3), lido da lista de códigos */  
  /* Representation #WITH_ICON adiciona ícones visuais */  
  @UI.lineItem: [   
    {   
      position: 40,   
      importance: #HIGH,  
      criticality: 'StatusPedidoCriticality',  
      criticalityRepresentation: #WITH_ICON,  
      label: 'Status do pedido'  
    }   
  ]  
  StatusPedido;  
    
  /* --- VALOR --- */  
  @UI.lineItem: [ { position: 60, label: 'Total', importance: #HIGH } ]  
  ValorTotal;   
}
```

> **Quando cada botão fica ativo:** a disponibilidade das ações não é decidida na anotação, e sim no BO, por *feature control* (lição 05.09). No projeto, **Efetuar Pagamento** só é habilitado para pedidos `ABERTO`, **Aprovar** só para `AGUARDANDO_APROVACAO` e **Cancelar** para esses dois status.

## Tabela de Cores (Criticality)

| Valor Backend | Significado | Cor Fiori | Ícone Típico (com `#WITH_ICON`) |
| :---- | :---- | :---- | :---- |
| **0** | Neutro | Cinza | Nenhum |
| **1** | Negativo | Vermelho | X / Erro |
| **2** | Crítico | Laranja/Amarelo | ! / Triângulo de Alerta |
| **3** | Positivo | Verde | V / Check de Sucesso |

## Glossário Técnico

* **Criticality (Criticidade):** Recurso de UI que altera a cor semântica de um campo (texto ou ícone) baseando-se em um valor numérico (0=Neutro/Cinza, 1=Erro/Vermelho, 2=Aviso/Amarelo, 3=Sucesso/Verde). Essencial para dashboards e listas de exceção.  

* **#FOR_ACTION:** Tipo de item de linha (type) usado na anotação `@UI.lineItem` para renderizar um botão que dispara uma ação `BDEF` (Behavior Definition). O framework cuida da chamada OData (POST) automaticamente.  

* **DataAction:** Propriedade da anotação `#FOR_ACTION` que define o nome técnico da ação (como definido no Behavior Definition) que será executada. Deve corresponder exatamente ao nome no backend.  

* **Importance:** Propriedade de responsividade que define a prioridade de exibição de uma coluna (`#HIGH`, `#MEDIUM`, `#LOW`). Determina se a coluna permanece na tabela ou se move para a área de detalhes (Pop-in) em telas menores.  

* **CriticalityRepresentation:** Define se a criticidade será mostrada apenas com cor no texto ou se incluirá um ícone (`#WITH_ICON`), melhorando a acessibilidade e leitura rápida.  

* **Inline Action:** Uma ação configurada para aparecer dentro da linha da tabela, ao invés da barra de ferramentas superior, facilitando o acesso rápido sem necessidade de seleção prévia.

## Quiz de Fixação

1. Onde deve ser calculada a lógica que define se um status é vermelho (1) ou verde (3)?  
  R: Preferencialmente na CDS View (usando a expressão CASE), criando um campo dedicado (ex: `StatusCriticality`). A Metadata Extension apenas aponta para esse campo. Isso mantém a lógica de negócio no backend (Code Pushdown) e deixa o frontend apenas com a renderização.  

2. Se eu definir uma coluna com importance: `#LOW`, o que acontece visualmente quando abro o aplicativo em um celular (tela estreita)?  
  R: A coluna será ocultada da grade principal da tabela para economizar espaço horizontal. Dependendo da configuração da tabela, os dados dessa coluna podem ficar acessíveis ao clicar na linha ou expandir um detalhe ("Pop-in"), mas não quebrarão o layout da tabela.  

3. Para adicionar um botão customizado na tabela (ex: "Aprovar"), qual anotação devo usar e qual pré-requisito é necessário no Backend?  
  R: Devo adicionar um item na anotação `@UI.lineItem` com a propriedade type: `#FOR_ACTION` e apontar o dataAction para o nome da ação. O pré-requisito é que essa Ação (Action) esteja definida e implementada no Behavior Definition (`BDEF`) da entidade.
