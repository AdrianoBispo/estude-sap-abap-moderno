"use strict";
/* ============================================================
   Dados da trilha: cursos, lições, quizzes e referência
   ============================================================ */
const KD = f => `https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm?file=${f}.htm`;
const CS = f => `https://github.com/SAP-samples/abap-cheat-sheets/blob/main/${f}.md`;
const LJ = 'https://learning.sap.com/learning-journeys/acquire-core-abap-skills';
const KD_CLOUD = 'https://help.sap.com/doc/abapdocu_cp_index_htm/CLOUD/en-US/index.htm';

const COURSES = [
  {n:1, id:'c1', title:'Programação ABAP básica', en:'Basic ABAP Programming', color:'var(--sapIndication5)', bg:'var(--sapAccentBg6)', icon:'',
   desc:'Ambiente, sintaxe, classes locais, ABAP SQL, estruturas, tabelas internas, EML e RAP.'},
  {n:2, id:'c2', title:'Programação ABAP intermediária', en:'Intermediate ABAP Programming', color:'var(--sapIndication7)', bg:'var(--sapAccentBg5)', icon:'',
   desc:'Testes, conversões, strings, code pushdown, performance, autorizações, OO e exceções.'},
  {n:3, id:'c3', title:'Dicionário ABAP e CDS', en:'Data Modeling in ABAP Dictionary and ABAP CDS', color:'var(--sapIndication6)', bg:'var(--sapAccentBg7)', icon:'',
   desc:'Domínios, tabelas, tipos globais, CDS view entities, associações e anotações.'}
];

const LESSONS = [
 // ---------------- Curso 1
 {id:'primeiros-passos', c:1, u:'1', dur:'1 h 25 min', icon:'', title:'Primeiros passos', sub:'ABAP Cloud, Eclipse ADT, pacotes e sua primeira classe executável.',
  obj:['Explicar o que é ABAP Cloud e clean core','Criar um projeto ABAP Cloud e um pacote','Criar e ativar uma classe','Executar um Hello World no console'],
  docs:[['ABAP for Cloud Development (Keyword Documentation)',KD_CLOUD],['Cheat sheet: ABAP for Cloud Development',CS('19_ABAP_for_Cloud_Development')]],
  kw:'eclipse adt pacote package hello world if_oo_adt_classrun out write ativar f9'},
 {id:'tecnicas-basicas', c:1, u:'2', dur:'3 h 49 min', icon:'', title:'Técnicas básicas', sub:'Variáveis, tipos, cálculos, condições, repetições e o debugger.',
  obj:['Declarar objetos de dados e tipos','Escrever expressões aritméticas','Usar IF, CASE, DO e WHILE','Depurar com breakpoints'],
  docs:[['DATA',KD('abapdata')],['TYPES',KD('abaptypes')],['IF',KD('abapif')],['CASE',KD('abapcase')],['DO',KD('abapdo')],['Cheat sheet: Data Types and Data Objects',CS('16_Data_Types_and_Objects')],['Cheat sheet: Program Flow Logic',CS('13_Program_Flow_Logic')]],
  kw:'data types constants inline div mod if case do while debug breakpoint sy-index xsdbool'},
 {id:'classes-locais', c:1, u:'3', dur:'4 h 16 min', icon:'', title:'Classes locais', sub:'Classes, objetos, referências, atributos, métodos e construtores.',
  obj:['Definir e implementar uma classe local','Criar instâncias com NEW','Distinguir componentes de instância e estáticos','Escrever métodos com parâmetros e exceções'],
  docs:[['CLASS',KD('abapclass')],['METHODS',KD('abapmethods')],['Cheat sheet: ABAP Object Orientation',CS('04_ABAP_Object_Orientation')]],
  kw:'class definition implementation new ref to constructor methods importing returning static class-data me'},
 {id:'ler-dados', c:1, u:'4', dur:'1 h 22 min', icon:'', title:'Lendo dados do banco', sub:'ABAP SQL: SELECT SINGLE, SELECT INTO TABLE e CDS views como fonte.',
  obj:['Ler uma linha com SELECT SINGLE','Ler várias linhas em uma tabela interna','Usar host variables e sy-subrc','Ler dados por CDS views liberadas'],
  docs:[['SELECT',KD('abapselect')],['Cheat sheet: ABAP SQL',CS('03_ABAP_SQL')],['Cheat sheet: WHERE Conditions',CS('31_WHERE_Conditions')]],
  kw:'select single into table where order by up to rows sy-subrc sy-dbcnt host variable data preview'},
 {id:'estruturas', c:1, u:'5', dur:'1 h 06 min', icon:'', title:'Estruturas', sub:'Tipos estruturados, VALUE e CORRESPONDING.',
  obj:['Declarar tipos estruturados','Acessar componentes','Preencher com VALUE #( )','Copiar com CORRESPONDING #( )'],
  docs:[['TYPES BEGIN OF',KD('abaptypes_struc')],['Cheat sheet: Structures',CS('02_Structures')],['Cheat sheet: Constructor Expressions',CS('05_Constructor_Expressions')]],
  kw:'structure begin of end of value corresponding mapping except base include type'},
 {id:'tabelas-internas', c:1, u:'6', dur:'1 h 13 min', icon:'', title:'Tabelas internas', sub:'Standard, sorted e hashed: chaves, leitura, laços e expressões de tabela.',
  obj:['Escolher o tipo de tabela adequado','Inserir e ler linhas pela chave','Percorrer com LOOP AT','Usar expressões de tabela e FOR'],
  docs:[['LOOP AT itab',KD('abaploop_at_itab')],['READ TABLE',KD('abapread_table')],['Cheat sheet: Internal Tables',CS('01_Internal_Tables')]],
  kw:'internal table standard sorted hashed key append insert read table loop at field-symbol line_exists lines sort delete for'},
 {id:'business-objects', c:1, u:'7', dur:'1 h', icon:'', title:'Business objects e EML', sub:'Alterando dados pelo comportamento RAP com READ, MODIFY e COMMIT ENTITIES.',
  obj:['Explicar por que usar business objects','Ler com READ ENTITIES','Alterar com MODIFY ENTITIES','Persistir com COMMIT ENTITIES'],
  docs:[['Cheat sheet: ABAP EML in RAP',CS('08_EML_ABAP_for_RAP')],['Cheat sheet: SAP LUW',CS('17_SAP_LUW')]],
  kw:'eml modify entities read entities commit entities rollback failed reported buffer transacional luw'},
 {id:'rap', c:1, u:'8', dur:'2 h 24 min', icon:'', title:'Modelo RAP', sub:'Camadas, comportamento e serviço OData de uma aplicação Fiori.',
  obj:['Descrever as camadas do RAP','Diferenciar managed, unmanaged e draft','Reconhecer determinations, validations e actions','Publicar um serviço com service binding'],
  docs:[['Cheat sheet: RAP Behavior Definition Language',CS('36_RAP_Behavior_Definition_Language')],['Cheat sheet: CDS View Entities',CS('15_CDS_View_Entities')]],
  kw:'rap behavior definition managed draft determination validation action service definition binding odata fiori elements'},
 // ---------------- Curso 2
 {id:'analise-testes', c:2, u:'1 + 9', dur:'3 h 54 min', icon:'', title:'Análise, testes e documentação', sub:'ATC, ABAP Unit, profiling, SQL trace e ABAP Doc.',
  obj:['Rodar o ATC e interpretar prioridades','Escrever uma classe de teste','Rodar testes ABAP Unit','Documentar com ABAP Doc'],
  docs:[['Cheat sheet: ABAP Unit Tests',CS('14_ABAP_Unit_Tests')],['Cheat sheet: Performance Notes',CS('32_Performance_Notes')]],
  kw:'atc abap unit for testing setup assert_equals profiler sql trace abap doc'},
 {id:'tipos-conversoes', c:2, u:'2', dur:'2 h 25 min', icon:'', title:'Tipos e conversões', sub:'Regras de conversão, CONV, EXACT e tipo de cálculo.',
  obj:['Prever conversões implícitas','Usar CONV e EXACT','Entender o tipo de cálculo','Evitar perdas silenciosas'],
  docs:[['Conversion Rules',KD('abenconversion_rules')],['Cheat sheet: Data Types and Data Objects',CS('16_Data_Types_and_Objects')],['Cheat sheet: Numeric Operations',CS('29_Numeric_Operations')]],
  kw:'conversão conv exact arredondamento overflow cx_sy_conversion decfloat34 tipo de cálculo'},
 {id:'strings', c:2, u:'3', dur:'2 h 10 min', icon:'', title:'Processando texto', sub:'String templates, funções de texto e expressões regulares.',
  obj:['Formatar com string templates','Usar funções embutidas de texto','Aplicar expressões regulares PCRE'],
  docs:[['Cheat sheet: String Processing',CS('07_String_Processing')],['Cheat sheet: Regular Expressions',CS('28_Regular_Expressions')],['Cheat sheet: Built-in Functions',CS('24_Builtin_Functions')]],
  kw:'string template condense substring find replace segment strlen to_upper pcre regex matches'},
 {id:'sql-pushdown', c:2, u:'4', dur:'5 h 40 min', icon:'', title:'Code pushdown em ABAP SQL', sub:'Agregações, GROUP BY, CASE, joins e expressões no banco.',
  obj:['Explicar code pushdown','Agregar com GROUP BY e HAVING','Usar CASE e funções SQL','Combinar tabelas com joins'],
  docs:[['SELECT',KD('abapselect')],['Cheat sheet: ABAP SQL',CS('03_ABAP_SQL')]],
  kw:'pushdown count sum avg min max group by having case join inner left outer cast concat'},
 {id:'performance-tabelas', c:2, u:'5', dur:'3 h 10 min', icon:'', title:'Performance de tabelas internas', sub:'Custo de acesso, chaves secundárias e acesso sem cópia.',
  obj:['Comparar custos de leitura','Definir chaves secundárias','Escolher entre work area, field-symbol e referência'],
  docs:[['Cheat sheet: Internal Tables',CS('01_Internal_Tables')],['Cheat sheet: Performance Notes',CS('32_Performance_Notes')]],
  kw:'performance secondary key chave secundária using key field-symbol reference into binary hash select em loop'},
 {id:'autorizacoes', c:2, u:'6', dur:'50 min', icon:'', title:'Verificações de autorização', sub:'Objetos de autorização, AUTHORITY-CHECK e access control em CDS.',
  obj:['Explicar objeto de autorização e role','Codificar AUTHORITY-CHECK','Interpretar sy-subrc','Proteger CDS com DCL'],
  docs:[['AUTHORITY-CHECK',KD('abapauthority-check')],['Cheat sheet: Authorization Checks',CS('25_Authorization_Checks')]],
  kw:'authority-check objeto de autorização role actvt dcl access control pfcg_auth'},
 {id:'oo-avancado', c:2, u:'7', dur:'3 h', icon:'', title:'Orientação a objetos eficaz', sub:'Herança, interfaces, polimorfismo, casting e padrões de projeto.',
  obj:['Usar herança e redefinição','Implementar interfaces','Aplicar polimorfismo e casting','Usar factory e singleton'],
  docs:[['INTERFACE',KD('abapinterface')],['Cheat sheet: ABAP Object Orientation',CS('04_ABAP_Object_Orientation')],['Cheat sheet: OO Design Patterns',CS('34_OO_Design_Patterns')]],
  kw:'inheriting from redefinition interface abstract final polimorfismo cast is instance of factory singleton create private'},
 {id:'excecoes', c:2, u:'8', dur:'1 h', icon:'', title:'Classes de exceção', sub:'Hierarquia, TRY…CATCH e exceções próprias com mensagens.',
  obj:['Distinguir static, dynamic e no check','Tratar exceções com TRY…CATCH','Criar e lançar exceções próprias'],
  docs:[['TRY',KD('abaptry')],['RAISE EXCEPTION',KD('abapraise_exception_class')],['Cheat sheet: Exceptions',CS('27_Exceptions')]],
  kw:'try catch cleanup raise exception cx_root cx_static_check cx_dynamic_check cx_no_check zerodivide'},
 // ---------------- Curso 3
 {id:'modelagem', c:3, u:'1 + 3', dur:'3 h 23 min', icon:'', title:'Modelagem e tipos globais', sub:'ABAP Dictionary, CDS, domínios e elementos de dados.',
  obj:['Descrever as tarefas do Dictionary e do CDS','Nomear os principais objetos','Diferenciar domínio e elemento de dados','Usar tipos globais'],
  docs:[['Cheat sheet: ABAP Dictionary',CS('26_ABAP_Dictionary')],['Cheat sheet: Data Types and Data Objects',CS('16_Data_Types_and_Objects')]],
  kw:'dictionary domínio elemento de dados data element domain estrutura tipo de tabela tipos embutidos'},
 {id:'tabelas-bd', c:3, u:'2', dur:'3 h 24 min', icon:'', title:'Tabelas de banco', sub:'define table, chaves, classe de entrega e campos de moeda.',
  obj:['Definir uma tabela com define table','Configurar anotações técnicas','Modelar campos de valor e moeda','Preencher dados de teste'],
  docs:[['Cheat sheet: ABAP Dictionary',CS('26_ABAP_Dictionary')]],
  kw:'define table key client delivery class curr cuky foreign key insert'},
 {id:'cds-basico', c:3, u:'4', dur:'2 h 13 min', icon:'', title:'CDS view entities', sub:'Views, parâmetros e joins em CDS.',
  obj:['Definir uma CDS view entity','Usar nomes semânticos e chaves','Criar views com parâmetros','Escrever joins em CDS'],
  docs:[['Cheat sheet: CDS View Entities',CS('15_CDS_View_Entities')]],
  kw:'cds view entity define as select from parameters join data preview vdm'},
 {id:'associacoes', c:3, u:'5', dur:'3 h 34 min', icon:'', title:'Relações e associações', sub:'Associações, cardinalidade e expressões de caminho.',
  obj:['Declarar associações','Escolher a cardinalidade','Usar expressões de caminho','Consumir associações em ABAP SQL'],
  docs:[['Cheat sheet: CDS View Entities',CS('15_CDS_View_Entities')],['Cheat sheet: ABAP SQL',CS('03_ABAP_SQL')]],
  kw:'association cardinalidade path expression caminho $projection _carrier'},
 {id:'cds-pushdown', c:3, u:'6', dur:'3 h 36 min', icon:'', title:'Code pushdown em CDS', sub:'Expressões, funções, CASE e agregações em views.',
  obj:['Calcular em CDS','Usar funções embutidas','Classificar com CASE','Agregar com group by'],
  docs:[['Cheat sheet: CDS View Entities',CS('15_CDS_View_Entities')]],
  kw:'case cast division concat dats_days_between $session sum count avg group by having'},
 {id:'meta-objetos', c:3, u:'7', dur:'3 h 51 min', icon:'', title:'Anotações e meta objetos', sub:'Anotações, metadata extensions, camadas e extensões.',
  obj:['Classificar anotações','Usar @UI para Fiori Elements','Separar anotações em metadata extensions','Estender views'],
  docs:[['Cheat sheet: CDS View Entities',CS('15_CDS_View_Entities')]],
  kw:'annotation anotação @ui lineitem selectionfield metadata extension layer extend view'}
];
LESSONS.forEach((l,i)=>{ l.idx=i; });

/* Quizzes: a = índice da resposta correta */
const QUIZ = {
 'primeiros-passos':[
  {q:'Qual interface uma classe implementa para escrever no console do ADT com F9?',o:['IF_OO_ADT_CLASSRUN','IF_SERIALIZABLE_OBJECT','IF_T100_MESSAGE','IF_ABAP_CONSOLE'],a:0,why:'O método IF_OO_ADT_CLASSRUN~MAIN recebe o objeto out, usado para escrever no console.'},
  {q:'O que caracteriza a versão de linguagem ABAP for Cloud Development?',o:['Permite qualquer tabela do sistema','Usa apenas APIs liberadas e sintaxe moderna','Só funciona no SAP GUI','É uma linguagem diferente do ABAP'],a:1,why:'É um subconjunto do ABAP restrito a objetos liberados, garantindo extensões seguras para upgrade.'},
  {q:'Qual atalho ativa o objeto de desenvolvimento aberto no ADT?',o:['F8','Ctrl+F3','Ctrl+1','Shift+F1'],a:1,why:'Ctrl+F3 ativa. F8 abre o Data Preview, Ctrl+1 é quick fix e Shift+F1 formata.'}],
 'tecnicas-basicas':[
  {q:'Qual o tipo deduzido em DATA(code) = \'LH\'.?',o:['string','c LENGTH 2','n LENGTH 2','abap_bool'],a:1,why:'Aspas simples criam um literal de texto do tipo c com o tamanho do literal. Crases criam string.'},
  {q:'Qual o valor de -7 MOD 3 em ABAP?',o:['-1','1','2','-2'],a:2,why:'Em ABAP o resultado de MOD nunca é negativo: -7 = 3 × (-3) + 2.'},
  {q:'Dentro de um DO … ENDDO, qual campo do sistema conta as voltas?',o:['sy-tabix','sy-index','sy-dbcnt','sy-subrc'],a:1,why:'sy-index conta voltas de DO e WHILE. sy-tabix é o índice da linha em LOOP AT.'}],
 'classes-locais':[
  {q:'Como se chama um componente estático de uma classe a partir de fora?',o:['objeto->componente','classe=>componente','classe-componente','classe~componente'],a:1,why:'O seletor => acessa componentes estáticos; -> acessa componentes de instância via referência.'},
  {q:'Quantos parâmetros RETURNING um método pode ter?',o:['Nenhum','Exatamente um','Até dez','Ilimitados'],a:1,why:'Um método funcional tem um único parâmetro RETURNING, sempre passado por valor.'},
  {q:'O que acontece com um objeto quando nenhuma referência aponta mais para ele?',o:['Continua até o fim da sessão','Gera um dump','É removido pelo garbage collector','É salvo no banco'],a:2,why:'Objetos sem referências são recolhidos automaticamente pelo garbage collector.'}],
 'ler-dados':[
  {q:'O que o prefixo @ indica em um comando ABAP SQL?',o:['Um campo da tabela','Uma host variable ABAP','Um comentário','Um parâmetro de CDS'],a:1,why:'Variáveis e expressões ABAP dentro do SQL são escapadas com @.'},
  {q:'Após um SELECT que não encontra nenhuma linha, qual é o sy-subrc?',o:['0','4','8','12'],a:1,why:'sy-subrc = 4 quando nenhuma linha é encontrada; 0 quando ao menos uma é lida.'},
  {q:'No ABAP Cloud, como ler dados de tabelas padrão SAP?',o:['Direto com SELECT na tabela','Por CDS views liberadas','Com CALL TRANSACTION','Pelo SAP GUI'],a:1,why:'Tabelas SAP não são liberadas; o acesso é feito por CDS views liberadas como I_Country.'}],
 'estruturas':[
  {q:'Qual caractere seleciona um componente de estrutura?',o:['.','~','-','=>'],a:2,why:'connection-carrier_id usa o hífen como seletor de componente.'},
  {q:'O que CORRESPONDING #( ) copia por padrão?',o:['Todos os componentes por posição','Componentes com o mesmo nome','Apenas a chave','Nada sem MAPPING'],a:1,why:'Componentes com nomes iguais são copiados; MAPPING liga nomes diferentes.'},
  {q:'Para que serve BASE em CORRESPONDING #( BASE ( alvo ) origem )?',o:['Manter valores do alvo que não vêm da origem','Ordenar componentes','Converter tipos','Copiar só a chave'],a:0,why:'Sem BASE, componentes não copiados ficam iniciais; com BASE, mantêm o valor original do alvo.'}],
 'tabelas-internas':[
  {q:'Qual tipo de tabela tem leitura pela chave completa em tempo constante?',o:['STANDARD','SORTED','HASHED','Nenhum'],a:2,why:'Tabelas hashed usam função hash; o tempo de leitura não depende do número de linhas.'},
  {q:'O que acontece ao usar itab[ chave ] quando a linha não existe?',o:['Retorna linha inicial','sy-subrc = 4','Exceção CX_SY_ITAB_LINE_NOT_FOUND','Dump sempre, sem tratamento possível'],a:2,why:'Expressões de tabela lançam CX_SY_ITAB_LINE_NOT_FOUND, a menos que use OPTIONAL ou DEFAULT.'},
  {q:'Inserir uma chave duplicada em uma SORTED TABLE com UNIQUE KEY via INSERT … INTO TABLE resulta em:',o:['Duplicata inserida','sy-subrc = 4, nada inserido','Ordenação perdida','Tabela limpa'],a:1,why:'Com chave única, INSERT recusa a duplicata e define sy-subrc = 4.'}],
 'business-objects':[
  {q:'Onde MODIFY ENTITIES grava as alterações?',o:['Direto no banco','No buffer transacional','Num arquivo','No cache do navegador'],a:1,why:'As alterações ficam no buffer transacional até COMMIT ENTITIES.'},
  {q:'Por que não usar UPDATE direto em tabelas de um business object?',o:['UPDATE não existe no ABAP Cloud','Ignoraria validações, determinações e bloqueios do BO','É mais lento','Não grava em HANA'],a:1,why:'O BO concentra a lógica de negócio; escrever na tabela pula todas essas regras.'},
  {q:'Em uma implementação de comportamento (behavior pool), você deve chamar COMMIT ENTITIES?',o:['Sim, sempre','Não, o framework RAP controla a transação','Só em validações','Só com draft'],a:1,why:'Dentro do comportamento quem decide o commit é o framework; COMMIT ENTITIES é para consumidores externos.'}],
 'rap':[
  {q:'Qual artefato define quais entidades um serviço OData expõe?',o:['Service binding','Service definition','Behavior definition','Metadata extension'],a:1,why:'A service definition lista as entidades expostas; o service binding define protocolo e tipo (UI, API).'},
  {q:'Em um BO managed, quem implementa create, update e delete?',o:['O desenvolvedor, em ABAP','O framework RAP','O Fiori Elements','O ATC'],a:1,why:'No cenário managed o framework cuida da persistência padrão; você adiciona apenas lógica específica.'},
  {q:'Qual elemento de comportamento verifica a consistência dos dados antes de salvar?',o:['Determination','Action','Validation','Feature control'],a:2,why:'Validations rodam no save e podem rejeitar dados inconsistentes.'}],
 'analise-testes':[
  {q:'Qual adição marca uma classe local como classe de teste?',o:['FOR TESTING','TEST CLASS','INHERITING FROM cl_test','RISK LEVEL'],a:0,why:'FOR TESTING marca a classe e cada método de teste; DURATION e RISK LEVEL são atributos adicionais.'},
  {q:'Quando o método setup é executado?',o:['Uma vez por classe','Antes de cada método de teste','Depois de todos os testes','Só se falhar'],a:1,why:'setup roda antes de cada teste; class_setup roda uma vez por classe.'},
  {q:'Como começa um comentário ABAP Doc?',o:['*!','"!','//!','@doc'],a:1,why:'ABAP Doc usa "! logo antes da declaração documentada.'}],
 'tipos-conversoes':[
  {q:'Qual o resultado de atribuir o texto \'12.5\' a uma variável do tipo i?',o:['12','13','12.5','Exceção'],a:1,why:'A conversão para i arredonda comercialmente: 12,5 vira 13.'},
  {q:'Atribuir \'A1B2C3\' a uma variável n LENGTH 6 resulta em:',o:['A1B2C3','000123','123000','Exceção'],a:1,why:'Para n, só os dígitos são passados, alinhados à direita e completados com zeros.'},
  {q:'Qual operador lança exceção se a conversão perder informação?',o:['CONV','CAST','EXACT','VALUE'],a:2,why:'EXACT verifica perda (ex.: arredondamento) e lança exceção, ao contrário de CONV.'}],
 'strings':[
  {q:'O que condense( val = `  a   b  ` ) retorna?',o:['`a b`','`ab`','`  a   b`','`a   b`'],a:0,why:'condense remove espaços nas pontas e reduz sequências internas a um espaço.'},
  {q:'Quanto vale find( val = `ABAP` sub = `X` )?',o:['0','-1','4','Exceção'],a:1,why:'find retorna o deslocamento da ocorrência ou -1 quando não encontra.'},
  {q:'Em substring( val = `Trilha` off = 1 len = 3 ), qual o resultado?',o:['`Tri`','`ril`','`rilh`','`ilh`'],a:1,why:'off é baseado em zero: começa no segundo caractere e pega três.'}],
 'sql-pushdown':[
  {q:'O que é code pushdown?',o:['Mover código para o navegador','Executar cálculos no banco e trazer só o resultado','Compilar ABAP em JavaScript','Usar mais LOOPs'],a:1,why:'O banco calcula agregações e filtros; menos dados trafegam para o servidor de aplicação.'},
  {q:'Num SELECT com GROUP BY carrier_id, qual campo pode aparecer sem função de agregação?',o:['Qualquer um','Somente carrier_id','Somente a chave da tabela','Nenhum'],a:1,why:'Elementos fora de agregações precisam estar no GROUP BY.'},
  {q:'Qual separador ABAP SQL usa entre alias e campo em joins?',o:['.','-','~','=>'],a:2,why:'Em ABAP SQL usa-se til: c~carrier_id. Em CDS usa-se ponto.'}],
 'performance-tabelas':[
  {q:'Em uma tabela sorted com 1.024 linhas, quantas comparações a busca binária faz no pior caso?',o:['1','10 a 11','512','1.024'],a:1,why:'log₂(1024) = 10; no pior caso cerca de 11 comparações.'},
  {q:'Qual forma de LOOP evita copiar cada linha?',o:['INTO DATA(wa)','ASSIGNING FIELD-SYMBOL(<fs>)','TRANSPORTING NO FIELDS sempre','WHERE'],a:1,why:'Field-symbols apontam para a própria linha da tabela, sem cópia.'},
  {q:'Para que servem chaves secundárias?',o:['Ordenar o banco','Ler rápido por outro critério sem duplicar a tabela','Criptografar dados','Substituir a chave primária'],a:1,why:'Uma tabela pode ter chaves secundárias sorted ou hashed para acessos por outros campos.'}],
 'autorizacoes':[
  {q:'Após AUTHORITY-CHECK, qual sy-subrc indica autorização concedida?',o:['0','4','8','12'],a:0,why:'0 = autorizado, 4 = sem autorização para os valores, 12 = nenhuma autorização para o objeto.'},
  {q:'Qual o código padrão de atividade para exibir?',o:['01','02','03','06'],a:2,why:'01 criar, 02 alterar, 03 exibir, 06 eliminar.'},
  {q:'Como proteger leituras de uma CDS view por autorização?',o:['AUTHORITY-CHECK em cada programa','Com um access control (DCL)','Com @UI','Com ABAP Doc'],a:1,why:'O DCL filtra linhas automaticamente em todo SELECT sobre a view.'}],
 'oo-avancado':[
  {q:'Qual adição permite que uma subclasse substitua a implementação de um método herdado?',o:['FINAL','REDEFINITION','ABSTRACT','DEFAULT'],a:1,why:'METHODS m REDEFINITION na subclasse substitui a implementação da superclasse.'},
  {q:'Um downcast inválido com CAST lança:',o:['CX_SY_MOVE_CAST_ERROR','CX_SY_ZERODIVIDE','CX_ABAP_INVALID_VALUE','Nada'],a:0,why:'Use IS INSTANCE OF antes do CAST para evitar CX_SY_MOVE_CAST_ERROR.'},
  {q:'O que CREATE PRIVATE garante?',o:['A classe não pode ter métodos públicos','Só a própria classe cria instâncias','A classe é abstrata','A classe não tem construtor'],a:1,why:'Instâncias só podem ser criadas dentro da classe, como em factories e singletons.'}],
 'excecoes':[
  {q:'Qual superclasse obriga a declarar RAISING ou tratar a exceção, verificado pelo compilador?',o:['CX_STATIC_CHECK','CX_DYNAMIC_CHECK','CX_NO_CHECK','CX_ROOT diretamente'],a:0,why:'Exceções de CX_STATIC_CHECK são verificadas em tempo de compilação.'},
  {q:'Qual exceção ocorre em 100 / 0?',o:['CX_SY_CONVERSION_NO_NUMBER','CX_SY_ZERODIVIDE','CX_SY_ARITHMETIC_OVERFLOW','Nenhuma, resulta 0'],a:1,why:'Divisão por zero lança CX_SY_ZERODIVIDE. Só 0 / 0 resulta em 0 sem exceção.'},
  {q:'Com vários CATCH, qual é executado?',o:['O último compatível','O primeiro compatível','Todos os compatíveis','O mais específico, onde estiver'],a:1,why:'Os CATCH são avaliados em ordem; por isso coloque as classes mais específicas primeiro.'}],
 'modelagem':[
  {q:'Onde ficam os rótulos de campo (curto, médio, longo)?',o:['No domínio','No elemento de dados','Na tabela','Na CDS view'],a:1,why:'O elemento de dados carrega o significado de negócio e os rótulos.'},
  {q:'O que um domínio define?',o:['Tipo técnico, tamanho e valores fixos','Rótulos para a UI','Regras de autorização','A chave da tabela'],a:0,why:'O domínio descreve as propriedades técnicas e valores permitidos.'},
  {q:'Qual tipo do Dictionary representa um valor monetário?',o:['abap.dec','abap.curr','abap.cuky','abap.quan'],a:1,why:'abap.curr guarda o valor; abap.cuky guarda o código da moeda referenciado por ele.'}],
 'tabelas-bd':[
  {q:'Qual classe de entrega é usada para dados de aplicação (mestre e movimento)?',o:['#A','#C','#L','#S'],a:0,why:'#A é aplicação; #C customizing; #L temporário; #S sistema.'},
  {q:'Qual é o tamanho máximo do nome de uma tabela de banco no Dictionary?',o:['8','16','30','40'],a:1,why:'Nomes de tabelas de banco têm até 16 caracteres.'},
  {q:'Um campo abap.curr precisa de:',o:['Uma anotação apontando para o campo de moeda','Ser chave','Valor inicial','Uma CDS view'],a:0,why:'@Semantics.amount.currencyCode liga o valor ao campo de moeda (abap.cuky).'}],
 'cds-basico':[
  {q:'Qual palavra-chave cria uma CDS view entity?',o:['define view entity','create view','define table','annotate view'],a:0,why:'define view entity Nome as select from fonte { … }.'},
  {q:'Como se referencia um parâmetro dentro da view?',o:['@p_from','$parameters.p_from',':p_from','p_from#'],a:1,why:'Parâmetros são acessados com $parameters.nome.'},
  {q:'Qual prefixo VDM indica uma view de interface?',o:['C_','I_','R_','P_'],a:1,why:'I_ interface, C_ consumo, R_ raiz de business object.'}],
 'associacoes':[
  {q:'Quando o join de uma associação é executado?',o:['Sempre que a view é ativada','Somente quando uma expressão de caminho usa a associação','Nunca','Só em ABAP SQL'],a:1,why:'Associações são joins sob demanda: só viram SQL quando usadas.'},
  {q:'O que [0..*] indica?',o:['Exatamente uma linha','Nenhuma ou muitas linhas no destino','No máximo uma','Uma ou mais'],a:1,why:'A cardinalidade 0..* permite nenhuma ou várias linhas correspondentes.'},
  {q:'Como escrever o caminho para Name via _Carrier em ABAP SQL?',o:['_Carrier.Name','\\_Carrier-Name','_Carrier~Name','_Carrier=>Name'],a:1,why:'ABAP SQL usa barra invertida e hífen; CDS usa _Carrier.Name.'}],
 'cds-pushdown':[
  {q:'Qual função CDS divide com número definido de casas decimais?',o:['div( )','division( )','round( )','mod( )'],a:1,why:'division( a, b, n ) retorna o quociente com n casas decimais.'},
  {q:'Como obter a data atual do sistema em uma CDS view?',o:['sy-datum','$session.system_date','current_date( )','@today'],a:1,why:'$session.system_date é a variável de sessão com a data do sistema.'},
  {q:'O que avg( ) exige em CDS?',o:['Um alias numérico','A adição as com tipo decimal ou flutuante','Um parâmetro','Nada'],a:1,why:'avg( campo as abap.dec( 10, 2 ) ) define o tipo do resultado.'}],
 'meta-objetos':[
  {q:'Qual anotação permite metadata extensions em uma view?',o:['@Metadata.allowExtensions: true','@UI.extend','@AbapCatalog.extensible','@ObjectModel.extension'],a:0,why:'Sem @Metadata.allowExtensions: true, a view não aceita metadata extensions.'},
  {q:'Qual anotação coloca um campo como coluna na list report?',o:['@UI.selectionField','@UI.lineItem','@UI.facet','@UI.headerInfo'],a:1,why:'@UI.lineItem define colunas; @UI.selectionField define filtros.'},
  {q:'Entre as camadas #CORE e #CUSTOMER, qual prevalece?',o:['#CORE','#CUSTOMER','A mais antiga','Nenhuma, dá erro'],a:1,why:'Camadas mais altas sobrescrevem as inferiores; #CUSTOMER fica no topo.'}]
};

/* Referência rápida */
const REF = [
 ['Dados','DATA name TYPE type [VALUE val].','Declara variável.','tecnicas-basicas'],
 ['Dados','DATA(name) = expr.','Declaração inline com tipo deduzido.','tecnicas-basicas'],
 ['Dados','TYPES ty TYPE p LENGTH 8 DECIMALS 2.','Declara tipo local.','tecnicas-basicas'],
 ['Dados','CONSTANTS c TYPE i VALUE 10.','Declara constante.','tecnicas-basicas'],
 ['Dados','CONV type( expr )','Converte para o tipo indicado.','tipos-conversoes'],
 ['Dados','EXACT type( expr )','Converte sem perdas ou lança exceção.','tipos-conversoes'],
 ['Dados','VALUE #( comp = val … )','Constrói estrutura ou tabela.','estruturas'],
 ['Dados','CORRESPONDING #( src [MAPPING a = b] [EXCEPT c] )','Copia componentes de mesmo nome.','estruturas'],
 ['Controle','IF … ELSEIF … ELSE … ENDIF.','Condição.','tecnicas-basicas'],
 ['Controle','CASE x. WHEN … WHEN OTHERS. ENDCASE.','Desvio por valor.','tecnicas-basicas'],
 ['Controle','DO n TIMES. … ENDDO.','Repetição contada (sy-index).','tecnicas-basicas'],
 ['Controle','WHILE cond. … ENDWHILE.','Repetição condicional.','tecnicas-basicas'],
 ['Controle','xsdbool( cond )','Condição como abap_bool.','tecnicas-basicas'],
 ['OO','CLASS lcl DEFINITION. … ENDCLASS.','Define classe.','classes-locais'],
 ['OO','DATA(obj) = NEW lcl( p = v ).','Cria instância.','classes-locais'],
 ['OO','obj->meth( ) / lcl=>static( )','Chama método de instância / estático.','classes-locais'],
 ['OO','CLASS lcl2 DEFINITION INHERITING FROM lcl.','Herança.','oo-avancado'],
 ['OO','METHODS m REDEFINITION.','Redefine método herdado.','oo-avancado'],
 ['OO','INTERFACES lif.','Implementa interface.','oo-avancado'],
 ['OO','CAST type( ref ) / IS INSTANCE OF','Downcast e verificação de tipo.','oo-avancado'],
 ['SQL','SELECT SINGLE FROM t FIELDS … WHERE … INTO @DATA(wa).','Lê uma linha.','ler-dados'],
 ['SQL','SELECT FROM t FIELDS … INTO TABLE @DATA(itab).','Lê várias linhas.','ler-dados'],
 ['SQL','… ORDER BY f … UP TO n ROWS.','Ordena e limita.','ler-dados'],
 ['SQL','COUNT( * ), SUM( ), AVG( ), MIN( ), MAX( ) … GROUP BY … HAVING','Agregações no banco.','sql-pushdown'],
 ['SQL','INNER JOIN / LEFT OUTER JOIN … ON a~f = b~f','Junções.','sql-pushdown'],
 ['SQL','CASE WHEN … THEN … ELSE … END','Expressão condicional.','sql-pushdown'],
 ['SQL','\\_assoc-campo','Expressão de caminho em ABAP SQL.','associacoes'],
 ['Tabelas','TYPE STANDARD|SORTED|HASHED TABLE OF … WITH … KEY','Declara tabela interna.','tabelas-internas'],
 ['Tabelas','APPEND wa TO itab. / INSERT wa INTO TABLE itab.','Insere linhas.','tabelas-internas'],
 ['Tabelas','READ TABLE itab INTO wa WITH KEY …','Lê linha (sy-subrc).','tabelas-internas'],
 ['Tabelas','itab[ key = val ]','Expressão de tabela (exceção se não achar).','tabelas-internas'],
 ['Tabelas','LOOP AT itab ASSIGNING FIELD-SYMBOL(<fs>) WHERE …','Percorre sem cópia.','tabelas-internas'],
 ['Tabelas','line_exists( itab[ … ] ) / lines( itab )','Existe? / quantas linhas.','tabelas-internas'],
 ['Tabelas','VALUE #( FOR x IN itab ( … ) )','Constrói tabela a partir de outra.','tabelas-internas'],
 ['Tabelas','WITH NON-UNIQUE SORTED KEY k COMPONENTS …','Chave secundária.','performance-tabelas'],
 ['Texto','|texto { expr WIDTH = 10 ALIGN = RIGHT }|','String template.','strings'],
 ['Texto','condense( ) / to_upper( ) / strlen( )','Funções de texto.','strings'],
 ['Texto','substring( val = s off = o len = l )','Parte do texto (off baseado em 0).','strings'],
 ['Texto','find( ) / replace( ) / segment( )','Busca, troca, separa.','strings'],
 ['Texto','matches( val = s pcre = `…` )','Teste com expressão regular.','strings'],
 ['Exceções','TRY. … CATCH cx INTO DATA(e). … CLEANUP. … ENDTRY.','Trata exceções.','excecoes'],
 ['Exceções','RAISE EXCEPTION NEW zcx( … ).','Lança exceção.','excecoes'],
 ['RAP','READ ENTITIES OF bo ENTITY e … RESULT DATA(r).','Lê pelo BO.','business-objects'],
 ['RAP','MODIFY ENTITIES OF bo ENTITY e UPDATE FIELDS ( f ) WITH …','Altera no buffer.','business-objects'],
 ['RAP','COMMIT ENTITIES.','Persiste o buffer.','business-objects'],
 ['Segurança','AUTHORITY-CHECK OBJECT \'obj\' ID \'campo\' FIELD val.','Verifica autorização.','autorizacoes'],
 ['CDS','define view entity Z… as select from t { key … }','View entity.','cds-basico'],
 ['CDS','association [0..*] to Z… as _a on $projection.k = _a.k','Associação.','associacoes'],
 ['CDS','define table z… { key client : abap.clnt not null; … }','Tabela de banco.','tabelas-bd'],
 ['CDS','annotate entity Z… with { @UI.lineItem: [{ position: 10 }] campo; }','Metadata extension.','meta-objetos'],
 ['Testes','CLASS ltc DEFINITION FOR TESTING DURATION SHORT RISK LEVEL HARMLESS.','Classe de teste.','analise-testes'],
 ['Testes','cl_abap_unit_assert=>assert_equals( exp = … act = … ).','Asserção.','analise-testes']
];

const GLOSS = [
 ['ADT','ABAP Development Tools: plug-ins do Eclipse para desenvolver ABAP.'],
 ['ABAP Cloud','Modelo de desenvolvimento com linguagem restrita a APIs liberadas, para extensões seguras para upgrade.'],
 ['Clean core','Princípio de manter o núcleo SAP sem modificações, estendendo apenas por pontos liberados.'],
 ['Pacote','Contêiner de objetos de desenvolvimento; define transporte e visibilidade.'],
 ['Host variable','Variável ABAP usada dentro do ABAP SQL, escapada com @.'],
 ['Work area','Estrutura que recebe uma cópia de uma linha de tabela interna.'],
 ['Field-symbol','Ponteiro nomeado para um objeto de dados existente, ex.: <fs>.'],
 ['EML','Entity Manipulation Language: comandos ABAP para ler e alterar business objects RAP.'],
 ['Buffer transacional','Memória onde o RAP guarda alterações até o commit.'],
 ['RAP','ABAP RESTful Application Programming Model, para serviços OData e apps Fiori.'],
 ['BDEF','Behavior definition: descreve operações e regras de um business object.'],
 ['Service binding','Liga uma service definition a um protocolo (OData V2/V4, UI ou API).'],
 ['CDS','Core Data Services: linguagem para modelos de dados semânticos no banco.'],
 ['VDM','Virtual Data Model: conjunto de CDS views padronizadas do S/4HANA.'],
 ['DCL','Data Control Language: access controls que filtram linhas de CDS por autorização.'],
 ['ATC','ABAP Test Cockpit: ferramenta de verificações estáticas.'],
 ['Code pushdown','Executar cálculos no banco em vez do servidor de aplicação.'],
 ['SAP LUW','Unidade lógica de trabalho: alterações confirmadas ou desfeitas juntas.']
];
