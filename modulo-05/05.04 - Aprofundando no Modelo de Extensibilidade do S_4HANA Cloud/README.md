# Aprofundando no Modelo de Extensibilidade do S/4HANA Cloud

![Infográfico - Aprofundando no Modelo de Extensibilidade do S/4HANA Cloud](./05.04_Clean_Core_Extensibilidade_SAP_S4HANA.png)

> **Comece pelos slides: [O modelo de extensibilidade do S/4HANA Cloud](./05.04_O_modelo_de_extensibilidade_do_S4HANA_Cloud.pptx)**
>
> Material complementar em PDF: [Dominando Cloud BAdIs para um Clean Core](./05.04_Cloud_BAdIs_for_a_Clean_Core.pdf)
>
> **Referência oficial (ABAP Keyword Documentation):** [Enhancements Using BAdIs](https://help.sap.com/docs/abap-cloud/abap-keywords/enhancements-using-badis)

## Objetivos de Aprendizagem

- Compreender profundamente o papel arquitetural dos **Cloud BAdIs (Business Add-Ins)** como a evolução orientada a objetos e segura para os antigos User Exits e Customer Exits, garantindo a estabilidade do sistema.  

- Dominar a navegação e busca de pontos de extensão liberados (**Released BAdIs**) utilizando as ferramentas de repositório do ADT (Eclipse), abandonando transações legadas como `SE18`.  

- Implementar uma **Enhancement Implementation** completa para cenários de validação ou modificação de dados em processos standard, respeitando os contratos de interface.  

- Entender e justificar as **limitações técnicas de lógica** impostas dentro de um _BAdI Cloud_ (como a proibição de `COMMIT WORK` e acesso a arquivos), relacionando-as com a integridade da _LUW (Logical Unit of Work)_ e a segurança da nuvem.

## 1. O Fim das "User Exits": Uma Mudança de Paradigma

No paradigma legado do _SAP ECC_, a extensibilidade era frequentemente invasiva. Para validar um campo num pedido de venda, desenvolvedores utilizavam a transação `CMOD/SMOD` (`Customer Exits`) ou modificavam diretamente *Includes* de sistema como o famoso `MV45AFZZ` (`User Exits`).

### O Problema da Abordagem Clássica

* **Fragilidade:** Esses métodos dependem de código procedural e variáveis globais. Uma mudança no programa principal da SAP durante um upgrade poderia facilmente quebrar a lógica do cliente ou alterar o comportamento de variáveis não documentadas.  

* **Conflito de Nomes:** Em User Exits, não havia isolamento de variáveis, levando a colisões ("Variable Shadowing").  

* **Sequenciamento:** Se múltiplos projetos precisassem usar a mesma User Exit, o código virava uma "colcha de retalhos" de IFs difícil de gerenciar.

### A Solução Moderna (Clean Core) 

A SAP substituiu esses mecanismos pelos Cloud BAdIs (Business Add-Ins). Ao contrário das User Exits, os BAdIs são objetos explicitamente liberados para a nuvem.

* **Orientação a Objetos:** Cada BAdI é definido por uma Interface ABAP clara. Você sabe exatamente o que entra (Importing) e o que pode ser alterado (Changing).  
* **Estabilidade Contratual:** A SAP garante que a assinatura do método do BAdI não mudará em upgrades futuros, protegendo seu investimento.  
* **Múltiplas Implementações:** O framework suporta múltiplas implementações ativas para o mesmo ponto de extensão, permitindo que diferentes soluções de parceiros coexistam sem conflito de código.

## 2. Localizando BAdIs Liberados

A era da transação `SE18` (Definição de BAdI) e `SE19` (Implementação) acabou para o desenvolvedor Cloud. No modelo ABAP Cloud, a descoberta de pontos de extensão acontece exclusivamente no **ADT (Eclipse)**.

**Passo a Passo de Descoberta:**

1. Abra a view **Project Explorer** no Eclipse.  
2. Navegue pela árvore de objetos: **Released Objects** > **Enhancements** > **Business Add-ins**.  
3. Esta árvore mostra *apenas* os BAdIs que a SAP marcou como seguros para uso na nuvem (Released API). Você pode filtrar por componente de aplicação (ex: SD para Vendas, MM para Materiais) para encontrar o ponto exato que precisa.

**Dica de Produtividade:** Para consultores funcionais ou Key Users, a SAP oferece o aplicativo Fiori *"Custom Logic"*. Ele permite buscar BAdIs de forma mais visual e ler a documentação funcional. Como desenvolvedores, podemos usar o app para descobrir o nome técnico do BAdI e depois implementá-lo no ADT para ter controle total do código.

## 3. Implementando um BAdI no ADT

A implementação técnica de um BAdI no Eclipse segue um fluxo moderno de criação de artefatos.

1. **Criar o Container (Enhancement Implementation):**  
   * Clique com o botão direito no seu Pacote (`Z_...`) > **New** > **ABAP Extension** > **BAdI Enhancement Implementation**. Este objeto atuará como um "container" que agrupa uma ou mais classes de implementação.  

1. **Escolher a Definição:**  
   * No assistente, você deve selecionar o **BAdI Definition** standard que deseja estender (ex: `SD_SLS_CHECK_HEAD` para validações de cabeçalho de vendas).  

2. **Implementar a Classe:**  
   * O ADT solicitará um nome para a **BAdI Implementation** (ex: `Z_IMPL_CHECK_PO`) e um nome para a **Classe de Implementação** (ex: `ZCL_SD_CHECK_PO`).  
   
   * Ao finalizar, o sistema gera automaticamente a classe Z implementando a interface correta. Você só precisa escrever o código dentro dos métodos vazios.

## 4. Restrições Importantes: Por que não posso dar COMMIT?

Ao escrever código dentro de um BAdI, você está operando sob as restrições da **Language Version 5** (ABAP Cloud), mas com regras adicionais de negócio.

* **PROIBIÇÃO DE COMMIT WORK:** Esta é a regra de ouro. O BAdI é chamado *dentro* da transação do processo standard (ex: no meio da gravação do Pedido de Venda).  
  * *O Risco:* Se você emitir um COMMIT WORK, você forçará a gravação prematura dos dados no banco. Se o processo standard falhar logo depois (ex: erro de validação posterior), você terá uma inconsistência de dados grave (metade gravada, metade não). A integridade da LUW (Logical Unit of Work) é sagrada.  

* **Sem Acesso Direto (Bypass):** Não tente fazer UPDATE direto em tabelas standard (VBAK, MARA). Você deve usar apenas os parâmetros CHANGING fornecidos pela interface do BAdI para modificar dados. O processo standard se encarregará de persistir essas mudanças no momento certo.  

* **Performance Crítica:** Este código roda de forma síncrona e bloqueante. Se seu BAdI demorar 5 segundos para rodar, a gravação do pedido demorará 5 segundos a mais. Evite SELECTs pesados ou chamadas de API externas síncronas.

## 5. Exemplo Prático: Validação de Pedido de Venda

Neste cenário, precisamos implementar uma regra de governança: impedir a criação de um Pedido de Venda se o campo "Referência do Cliente" (PurchaseOrderByCustomer) não estiver preenchido.

- **Definição do BAdI:** `SD_SLS_CHECK_HEAD` (Exemplo para Vendas).

- **Código da Classe de Implementação:**

``` ABAP
CLASS zcl_sd_check_po DEFINITION  
  PUBLIC  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    " A interface de marcação if_badi_interface é padrão  
    INTERFACES if_badi_interface .  
    " A interface específica do BAdI define os métodos disponíveis (check_header)  
    INTERFACES if_sd_sls_check_head .   
ENDCLASS.

CLASS zcl_sd_check_po IMPLEMENTATION.

  METHOD if_sd_sls_check_head~check_header.  
    " O parâmetro sales_order_header é uma estrutura de importação fornecida pelo Standard.  
    " Ela contém os dados do pedido que está sendo processado.  
      
    " Regra de Negócio: O campo de Referência (PurchaseOrderByCustomer) é obrigatório  
    IF sales_order_header-purchase_order_by_customer IS INITIAL.

      " Para rejeitar o processo, não usamos 'MESSAGE ... RAISE'.  
      " O padrão moderno é adicionar uma linha à tabela de mensagens 'messages'.  
        
      APPEND VALUE #(   
        msgid = 'ZMSG_SALES'                " Classe de mensagem customizada  
        msgno = '001'                       " Número da mensagem  
        msgty = 'E'                         " Tipo Erro (Impede gravação)  
        msgv1 = 'Campo Referência é obrigatório' " Variável de texto (opcional)  
      ) TO messages.  
        
      " Sinalizamos explicitamente ao framework que a verificação falhou.  
      " Isso instrui o processo standard a abortar a transação de forma limpa.  
      check_result = if_sd_sls_check_head=>rejection.  
        
    ENDIF.

  ENDMETHOD.

ENDCLASS.
```

## 6. Filtragem de BAdI: Otimização de Performance

Imagine que você implementou uma regra pesada para a Empresa '1000'. Se você colocar um `IF empresa = '1000'` dentro do código ABAP, o sistema terá que carregar sua classe e executar o método para *todos* os pedidos de *todas* as empresas, apenas para descobrir que não deve fazer nada na maioria dos casos.

Para evitar esse desperdício, usamos **BAdI Filters**.

* **Como funciona:** O BAdI Definition define quais campos podem ser filtrados (ex: SALES_ORG, DISTRIBUTION_CHANNEL).  

* **Configuração:** Na tela de implementação do BAdI no ADT, você adiciona uma condição de filtro: SALES_ORG = 1010.  

* **O Ganho:** O Kernel do ABAP verifica o filtro *antes* de instanciar sua classe. Se o pedido for da organização 2000, sua classe Z nem sequer é carregada na memória. Isso garante escalabilidade e performance máxima.

## Glossário Técnico

* **Cloud BAdI:** Um ponto de extensão orientado a objetos, explicitamente liberado pela SAP (Released API) para uso na nuvem. Permite a injeção de lógica customizada em processos standard sem modificar o núcleo, garantindo "Upgrade Safety".  
* **Enhancement Implementation:** O artefato técnico criado no ADT (extensão .badi) que atua como um container para a classe de implementação e define os valores de filtro para um BAdI específico.  
* **BAdI Interface:** A interface ABAP (ex: IF_SD_SLS_CHECK_HEAD) que define o contrato do BAdI: quais métodos devem ser implementados e quais dados estão disponíveis (Importing/Changing). Sua classe Z deve implementar esta interface.  
* **Filter Value:** Configuração declarativa na implementação do BAdI que restringe sua execução a critérios específicos (ex: apenas Org. Vendas 1000). Otimiza a performance ao evitar o carregamento desnecessário da classe ABAP.  
* **LUW (Logical Unit of Work):** Um conceito que define uma sequência de operações de banco de dados que devem ser tratadas como uma unidade atômica (ou tudo é salvo, ou nada é salvo). BAdIs rodam dentro da LUW do processo pai.

## Comparativo: Extensão Clássica vs Clean Core

| Característica | User Exit / Customer Exit (Legado) | Cloud BAdI (Moderno) |
| :---- | :---- | :---- |
| **Tecnologia** | Subrotinas (FORM) em Includes, Function Modules. | Classes e Interfaces ABAP OO. |
| **Estabilidade** | Baixa. Código pode quebrar se a SAP mudar variáveis globais. | Alta. Contrato de Interface garantido pela SAP. |
| **Múltiplas Implementações?** | Geralmente Não (apenas 1 include ativo por exit). | Sim. Vários parceiros podem implementar o mesmo BAdI. |
| **Filtros** | Não (IFs manuais ineficientes no código). | Sim (Filtro otimizado pelo Kernel ABAP). |

## Quiz de Fixação

1. Por que é estritamente proibido usar o comando COMMIT WORK dentro de uma implementação de BAdI de validação de pedido?  
  R: Porque o BAdI é executado dentro da LUW (Logical Unit of Work) do processo standard. Emitir um commit prematuro quebraria a transacionalidade, efetivando gravações parciais no banco de dados e possivelmente fechando o cursor do banco, o que causaria erros graves no processo principal da SAP.  

2. Qual é a vantagem de performance ao usar um "Filter Value" na configuração do BAdI em vez de escrever um comando IF dentro do código ABAP?  
  R: O uso de filtros permite que o Kernel do ABAP verifique a condição antes mesmo de carregar a classe de implementação na memória. Se o filtro não for atendido, a execução é pulada instantaneamente, economizando recursos de memória e CPU que seriam gastos para instanciar a classe e rodar o IF.  

3. Onde um desenvolvedor Clean Core deve procurar por BAdIs disponíveis para uso em um projeto S/4HANA Cloud?  
  R: Na árvore de "Released Objects" dentro do ABAP Development Tools (Eclipse), navegando até a categoria "Enhancements". A transação clássica `SE18` não deve ser usada, pois ela mostra todos os BAdIs do sistema, incluindo aqueles que não são liberados ou seguros para uso na nuvem.

## Links de Demonstrações

- [Implemente extensões adicionando um novo campo.](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?show=project!PR_C4129427A6E10880:uebung)
- [Implemente extensões adicionando uma nova ação.](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?show=project!PR_8C70C0B4D34D9CB6:uebung)
- [Implemente extensões adicionando uma nova validação.](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?show=project!PR_2B778AD125AAFBB5:uebung)
- [Implemente extensões adicionando um novo nó.](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?show=project!PR_52697900929AF293:uebung)
- [Implementar um BAdI lançado](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?show=project!PR_F5C8FF6C8EB37D99:uebung)
- [Utilize os recursos de busca de objetos do visualizador de repositório Cloudification.](https://learnsap.enable-now.cloud.sap/wa/mmcp/index.html?show=project!PR_B21FE28DFA71A891:uebung#2)
- [Configurar componentes de software para desenvolvimento ABAP Cloud e ABAP Classic](https://learnsap.enable-now.cloud.sap/wa/mmcp/index.html?show=project!PR_AC4D43D592CB95A1:uebung#2)
- [Configure as autorizações de desenvolvedor para o desenvolvimento ABAP Cloud e ABAP Classic.](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?show=project!PR_E795479B3AE3D8F:uebung)
- [Atribuir versões da linguagem ABAP a objetos de desenvolvimento](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?show=project!PR_DC8A1E5D4F326888:uebung)
