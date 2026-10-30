# Implementando Atualizações de Banco de Dados usando Business Objects

![Infográfico - Atualização de Dados no ABAP Moderno](./01.07_Atualizacao_de_Dados_no_ABAP_RAP.png)

> **Comece pelos slides: [Atualizando dados com Business Objects](./01.07_Atualizando_dados_com_Business_Objects.pptx)**
>
> Material complementar em PDF: [Implementando Atualizações de Banco de Dados](./01.07_Implementando_Atualizacoes_de_Banco_de_Dados.pdf)
>
> **Referência oficial (ABAP Keyword Documentation):** [ABAP EML - Consuming RAP BOs](https://help.sap.com/docs/abap-cloud/abap-keywords/abap-eml-consuming-rap-bos)

## Objetivos de Aprendizagem

- Compreender profundamente a arquitetura transacional do RAP e por que comandos de atualização direta SQL (INSERT, UPDATE, DELETE) são estritamente proibidos em cenários de negócio modernos.  

- Dominar a sintaxe e a semântica da **EML (Entity Manipulation Language)** para interagir programaticamente com Business Objects, tanto para leitura quanto para modificação.  

- Aplicar corretamente os comandos **MODIFY ENTITIES** para operações de criação, atualização, exclusão e execução de ações customizadas.  

- Gerenciar a transacionalidade utilizando **`COMMIT ENTITIES`**, compreendendo a distinção entre o *Transactional Buffer* e a persistência física no banco de dados.  

- Interpretar e manipular as estruturas de retorno padrão **FAILED**, **MAPPED** e **REPORTED** para tratamento robusto de erros.

## 1. O Fim do SQL Direto (INSERT/UPDATE)

No paradigma antigo do ABAP Clássico, a persistência de dados era direta e muitas vezes bruta. Se um desenvolvedor precisasse criar um Pedido de Venda, ele frequentemente escrevia um comando INSERT INTO vbap VALUES .... Embora eficiente do ponto de vista puramente técnico (banco de dados), essa abordagem é catastrófica para a integridade do negócio.

O Problema do "Bypass":  
Ao inserir diretamente na tabela, você está ignorando ("bypassing") toda a inteligência da aplicação.

* **Validações:** O código SQL não sabe que "Data de Entrega não pode ser menor que Data de Criação".  
* **Cálculos Automáticos:** O SQL não recalcula o valor total do pedido quando você insere um item.  
* **Autorizações:** O SQL não verifica se o usuário tem permissão para criar pedidos naquela Organização de Vendas.  
* **Logs e Auditoria:** O SQL não gera documentos de modificação (Change Documents) automaticamente.

A Solução (RAP):  
No modelo RAP, aplicamos o princípio de Encapsulamento. A tabela do banco de dados é privada do Business Object. Ninguém de fora pode tocá-la. Para modificar dados, você deve "pedir" ao Business Object. O BO atua como um guardião, garantindo que todas as regras sejam cumpridas antes que qualquer dado seja gravado.

## 2. O que é *EML* (Entity Manipulation Language)?

O *EML* não é uma nova linguagem separada, mas uma extensão poderosa da sintaxe ABAP nativa, desenhada especificamente para o modelo RAP. Enquanto o SQL foca em *tabelas*, o *EML* foca em *entidades* e *comportamentos*.

* **ABAP SQL (SELECT):** Utilizado para **Leitura** de dados em massa. O RAP permite (e encoraja) o uso de SQL para leitura direta de CDS Views para relatórios, pois leitura não afeta a integridade.  

* **EML (`MODIFY`, `READ`):** Utilizado para **Transações**. É a única porta de entrada para alterar dados ou executar lógicas de negócio (Ações) em um BO.

**Vantagens do EML:**

1. **Tipagem Forte:** O compilador verifica se os campos existem na entidade CDS.  
2. **Abstração:** Você não precisa saber em quais tabelas físicas o BO grava (pode ser uma, podem ser dez). O EML abstrai essa complexidade.  
3. **Buffer Transacional:** O EML trabalha em memória. As alterações não vão para o banco imediatamente; elas ficam num buffer gerenciado pelo framework até o commit.

## 3. A Sintaxe do MODIFY ENTITIES

O comando `MODIFY ENTITIES` é o canivete suíço do RAP. Ele permite Criar (`CREATE`), Alterar (`UPDATE`), Deletar (`DELETE`) e Executar Ações (`EXECUTE`).

### Estrutura Geral e Parâmetros de Retorno

``` ABAP
MODIFY ENTITIES OF Nome_Da_Definicao_De_Comportamento  
  ENTITY Nome_Da_Entidade  
    
  " Operação 1: Criar novas instâncias  
  CREATE FROM lt_novos_dados   
    
  " Operação 2: Atualizar instâncias existentes  
  UPDATE FROM lt_dados_alterados  
    
  " Operação 3: Executar uma Ação (Ex: Aprovar)  
  EXECUTE AprovarPedido FROM lt_chaves_acao

  " Retornos Padronizados (Sempre use!)  
  FAILED   DATA(ls_failed)  
  REPORTED DATA(ls_reported)  
  MAPPED   DATA(ls_mapped).
```

* **FAILED:** Contém as chaves das linhas que falharam. O framework preenche isso automaticamente se uma validação falhar.  

* **REPORTED:** Contém as mensagens de erro (T100) associadas às falhas. É aqui que você descobre *por que* falhou (ex: "Cliente inválido").  

* **MAPPED:** (Usado no `CREATE`) Contém o mapeamento entre o ID temporário (`%cid`) e a chave atribuída pelo BO. Com numeração antecipada (_Early Numbering_), a chave definitiva já vem no MAPPED; com numeração tardia (_Late Numbering_), a chave final só é atribuída na Save Phase e o MAPPED contém uma chave preliminar (`%pid`).

## 4. Transacionalidade: COMMIT ENTITIES

Uma diferença crítica entre o ABAP Clássico e o RAP é o gerenciamento da transação.

No clássico, `COMMIT WORK` disparava a gravação física imediata. No RAP, o processo é dividido em duas fases distintas:

1. **Interaction Phase (Fase de Interação):** Onde ocorrem os `MODIFY ENTITIES`. O framework executa verificações imediatas (autorização, feature control, prechecks e determinações *on modify*) e coloca os dados no **Transactional Buffer** (memória do servidor de aplicação). Nada foi gravado no banco ainda.  

2. **Save Phase (Fase de Salvamento):** Disparada pelo comando `COMMIT ENTITIES`. O framework pega os dados do buffer, executa as validações e determinações *on save* e, se tudo estiver ok, persiste no banco de dados.

**Sintaxe de Commit:**

``` ABAP
" Commit simples (Não recomendado se você precisa tratar erros de salvamento)  
COMMIT ENTITIES.

" Commit com Resposta (Recomendado)  
" Permite saber se houve erro durante o processo de gravação final  
COMMIT ENTITIES   
  RESPONSE OF Nome_Do_BDEF   
  FAILED DATA(ls_commit_failed)   
  REPORTED DATA(ls_commit_reported).
```

## 5. Exemplo Prático: Criando e Atualizando Itens de Estoque via EML

Neste exemplo, usamos o business object `ZR_PC_ITEM` do projeto [Pedidos de Compras](https://github.com/AdrianoBispo/sap-abap-rap-pedidos-de-compras-app): o programa cria um item de estoque e, logo em seguida, atualiza um campo dele, demonstrando a interação completa com o buffer.

``` ABAP
CLASS zcl_eml_demo DEFINITION  
  PUBLIC  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    INTERFACES if_oo_adt_classrun .  
  PROTECTED SECTION.  
  PRIVATE SECTION.  
ENDCLASS.

CLASS zcl_eml_demo IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.

    " ---------------------------------------------------------------------  
    " PASSO 1: Preparação dos Dados para CRIAÇÃO  
    " ---------------------------------------------------------------------  
    " O %cid (Content ID) é um identificador temporário obrigatório
    " que permite referenciar esta linha antes dela ter uma chave final.
    " O %control indica quais campos estamos fornecendo.  
    " TABLE FOR CREATE é o tipo derivado (Derived Type) gerado pelo RAP para a entidade.
      
    DATA lt_item_create TYPE TABLE FOR CREATE zr_pc_item.

    lt_item_create = VALUE #(  
      ( %cid = 'TEMP_ID_001'  
        Nome          = 'Mouse sem fio'  
        Categoria     = 'INFORMATICA'  
        QtdeEstoque   = 30  
        PrecoUnitario = '89.90'  
        Currency      = 'BRL'  
        %control-Nome          = if_abap_behv=>mk-on  
        %control-Categoria     = if_abap_behv=>mk-on  
        %control-QtdeEstoque   = if_abap_behv=>mk-on  
        %control-PrecoUnitario = if_abap_behv=>mk-on  
        %control-Currency      = if_abap_behv=>mk-on  
       )  
    ).

    " ---------------------------------------------------------------------  
    " PASSO 2: Executar o MODIFY (Interaction Phase)  
    " ---------------------------------------------------------------------  
    " Aqui, o framework executa as verificações da fase de interação
    " (autorização, feature control, prechecks) e as determinações on modify
    " (no BO Item, DefinirValoresIniciais e RecalcularStatusEstoque).
    " Validações "on save" (ex: ValidarItem) só rodam no COMMIT ENTITIES.  
      
    MODIFY ENTITIES OF zr_pc_item  
      ENTITY Item  
      CREATE FROM lt_item_create  
        
      " Captura de retornos  
      FAILED DATA(ls_failed)  
      REPORTED DATA(ls_reported)  
      MAPPED DATA(ls_mapped).

    IF ls_failed IS NOT INITIAL.  
      " Tratamento de Erro na Criação  
      " Leríamos ls_reported para mostrar a mensagem ao usuário.  
      out->write( 'Erro: Falha na criação do item.' ).  
        
      " Exemplo de como ler mensagens de erro do REPORTED  
      LOOP AT ls_reported-item INTO DATA(ls_msg).  
         DATA(lv_text) = ls_msg-%msg->if_message~get_text( ).  
         out->write( |Detalhe: { lv_text }| ).  
      ENDLOOP.  
      RETURN.   
    ENDIF.

    " Se chegou aqui, a criação foi bem sucedida NO BUFFER.
    " ZR_PC_ITEM usa numbering : managed: o UUID gerado já está no MAPPED.

    DATA(lv_new_item_uuid) = ls_mapped-item[ 1 ]-ItemUUID.  
    out->write( |Item criado no buffer com UUID: { lv_new_item_uuid }| ).

    " ---------------------------------------------------------------------  
    " PASSO 3: Atualização na mesma transação (Chaining)  
    " ---------------------------------------------------------------------  
    " Vamos ajustar o preço unitário para 79.90.  
      
    MODIFY ENTITIES OF zr_pc_item  
      ENTITY Item  
      UPDATE FIELDS ( PrecoUnitario ) " Só atualiza este campo  
      WITH VALUE #( ( ItemUUID      = lv_new_item_uuid  
                      PrecoUnitario = '79.90' ) )  
      FAILED DATA(ls_update_failed)  
      REPORTED DATA(ls_update_reported).

    IF ls_update_failed IS NOT INITIAL.  
       out->write( 'Erro ao atualizar o preço.' ).  
       RETURN.  
    ENDIF.

    " ---------------------------------------------------------------------  
    " PASSO 4: Persistir (Save Phase)  
    " ---------------------------------------------------------------------  
    " Até agora, nada está no banco. O COMMIT efetiva a transação.  
    " Na Save Phase, a determination GerarSku cria o SKU (ex.: SKU-INF-0000000007).  
      
    COMMIT ENTITIES  
      RESPONSE OF zr_pc_item  
      FAILED DATA(ls_commit_failed)  
      REPORTED DATA(ls_commit_reported).

    IF ls_commit_failed IS INITIAL.  
      out->write( 'Sucesso Total! Dados gravados no banco de dados.' ).  
    ELSE.  
      " Ex: validações "on save" (nome ou categoria vazios, quantidade negativa)  
      out->write( 'Erro durante a fase de salvamento (Save Sequence).' ).  
    ENDIF.

  ENDMETHOD.

ENDCLASS.
```

## Pontos de Atenção (Clássico vs. RAP)

| Operação | ABAP Clássico | ABAP Moderno (RAP) |
| :---- | :---- | :---- |
| **Criar Dados** | INSERT ztable FROM ls_data. (Direto, sem validação BO) | MODIFY ENTITIES ... CREATE. (Passa pelo BO) |
| **Alterar Dados** | UPDATE ztable SET ... | MODIFY ENTITIES ... UPDATE. |
| **Persistir** | COMMIT WORK. (Síncrono/Assíncrono direto) | COMMIT ENTITIES. (Dispara Save Sequence) |
| **Tratamento de Erro** | sy-subrc <> 0. | Parâmetros FAILED e REPORTED. |
| **Identificação** | Chave da tabela (obrigatória) | %cid (criação) ou Chave (atualização) |

## Glossário Técnico

* **EML (Entity Manipulation Language):** Extensão da linguagem ABAP utilizada para interagir com Business Objects no modelo RAP. Permite operações transacionais (MODIFY) e leitura transacional (READ ENTITIES), que também enxerga o conteúdo ainda não salvo do buffer.  

* **Business Object (BO):** Representação virtual de uma entidade de negócio (ex: Pedido de compra) que encapsula dados (CDS) e comportamento (Behavior Pool).  

* **%cid (Content ID):** Identificador temporário alfanumérico atribuído pelo consumidor (você) durante uma operação de CREATE. Ele serve para identificar a linha no buffer antes que o banco de dados gere a chave primária definitiva.  

* **Transactional Buffer:** Área de memória no servidor de aplicação onde o RAP armazena o estado das entidades modificadas durante a *Interaction Phase*. O SQL INSERT/UPDATE só ocorre quando este buffer é processado na *Save Phase*.  

* **FAILED Structure:** Tabela de retorno do EML que contém as chaves das instâncias que falharam na operação. Se uma linha está em FAILED, ela não será salva.  

* **REPORTED Structure:** Tabela de retorno do EML que contém objetos de mensagem (referências a T100) explicando a causa do erro. Geralmente ligada à chave da instância falha.  

* **MAPPED Structure:** Tabela de retorno vital para operações de criação (CREATE). Ela mapeia o %cid (ID temporário) para a chave real gerada pelo BO (ex: número do pedido).


## Quiz de Fixação

1. Qual é a principal vantagem de usar MODIFY ENTITIES em vez de um INSERT direto na tabela do banco de dados?  
  R: O MODIFY ENTITIES aciona toda a lógica do Business Object, incluindo validações, determinações (cálculos automáticos) e verificações de autorização. O INSERT direto ignora ("bypassa") essas regras, podendo gerar inconsistência nos dados (dados sujos).

2. Para que serve o parâmetro %cid em uma operação de criação EML?  
  R: O %cid (Content ID) serve para identificar unicamente uma linha sendo criada no buffer transacional antes que o banco de dados gere a chave primária definitiva. Ele é essencial para criar hierarquias (ex: criar Cabeçalho e Item juntos) onde o Item precisa referenciar o Cabeçalho que ainda não tem ID final.

3. O comando MODIFY ENTITIES grava os dados imediatamente no banco de dados?  
  R: Não. Ele apenas atualiza o Transactional Buffer na memória da sessão ABAP. A gravação física no banco de dados só ocorre quando o comando COMMIT ENTITIES é executado com sucesso e todas as validações de salvamento são aprovadas.

4. O que devo verificar para saber se uma operação EML (como UPDATE) foi bem-sucedida?  
  R: Você deve verificar se a estrutura de retorno FAILED está inicial (vazia). Se FAILED contiver registros, a operação falhou para aquelas instâncias específicas. Não confie em sy-subrc para comandos EML.

## Links de Demonstrações

- [Como analisar um objeto de negócios](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?show=project!PR_6DC14C585665F186:demo)
- [Como implementar uma declaração EML](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_3AD00A7871CEE7A8:demo)
