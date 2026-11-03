'use client';
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from 'react';
import {Check,Globe2,Languages,X} from 'lucide-react';
import './language.css';
export type SiteLanguage='pt'|'en'|'es';
const STORAGE_KEY='cg-v34-ui-language';
const LANGUAGES=[
 {id:'pt',flag:'🇧🇷',name:'Português',detail:'Brasil',native:'Português'},
 {id:'en',flag:'🇺🇸',name:'English',detail:'United States',native:'English'},
 {id:'es',flag:'🇪🇸',name:'Español',detail:'España / América Latina',native:'Español'},
] as const;
/** Translations are explicit: untranslated controls retain their original text, never a misleading machine translation. */
const words:Record<string,[string,string]>={
 'Editor de Artes':['Art Editor','Editor de Artes'],
 'Studio de Templates':['Template Studio','Studio de Plantillas'],
 'Studio Mockup 3D':['3D Mockup Studio','Studio Mockup 3D'],
 'Editor de Sublimação de Canecas':['Mug Sublimation Editor','Editor de Sublimación de Tazas'],
 'Templates':['Templates','Plantillas'],'Layouts':['Layouts','Diseños'],'Camadas':['Layers','Capas'],'Elementos':['Elements','Elementos'],
 'Personagens':['Characters','Personajes'],'Textos':['Text','Textos'],'Fundos':['Backgrounds','Fondos'],
 'Uploads':['Uploads','Archivos'],'Ícones':['Icons','Íconos'],'Objetos':['Objects','Objetos'],
 'Efeitos':['Effects','Efectos'],'Filtros & Efeitos':['Filters & Effects','Filtros y Efectos'],
 'Seu projeto':['Your project','Tu proyecto'],'Propriedades':['Properties','Propiedades'],
 'Exportar':['Export','Exportar'],'Cancelar':['Cancel','Cancelar'],'Confirmar':['Confirm','Confirmar'],
 'Salvar projeto':['Save project','Guardar proyecto'],'Abrir projeto':['Open project','Abrir proyecto'],
 'Resetar projeto':['Reset project','Reiniciar proyecto'],'Limpar projeto':['Clear project','Limpiar proyecto'],
 'Histórico local':['Local history','Historial local'],'Salvar no navegador':['Save in browser','Guardar en el navegador'],
 'Girar':['Rotate','Girar'],'Rotação':['Rotation','Rotación'],'Opacidade':['Opacity','Opacidad'],
 'Sombra':['Shadow','Sombra'],'Sombra X':['Shadow X','Sombra X'],'Sombra Y':['Shadow Y','Sombra Y'],
 'Cor da sombra':['Shadow color','Color de sombra'],'Cor':['Color','Color'],'Conta-gotas':['Eyedropper','Cuentagotas'],
 'Fundo':['Background','Fondo'],'Cor do fundo':['Background color','Color de fondo'],
 'Guias':['Guides','Guías'],'Ajuda':['Help','Ayuda'],'Aviso':['Notice','Aviso'],
 'Novo documento':['New document','Nuevo documento'],'Desfazer':['Undo','Deshacer'],'Refazer':['Redo','Rehacer'],
 'Criar do zero':['Start from scratch','Crear desde cero'],'Buscar no acervo...':['Search library...','Buscar en el catálogo...'],
 'Adicionar imagens':['Add images','Agregar imágenes'],'Seus arquivos, seu navegador':['Your files, your browser','Tus archivos, tu navegador'],
 'Tamanho':['Size','Tamaño'],'Largura':['Width','Ancho'],'Altura':['Height','Altura'],
 'Título':['Title','Título'],'Mensagem':['Message','Mensaje'],'Selecionar':['Select','Seleccionar'],
 'Área visível':['Visible area','Área visible'],'Configurações':['Settings','Configuración'],
 'Produto':['Product','Producto'],'Estampa':['Artwork','Diseño'],'Bocão':['Bottom print','Impresión inferior'],
 'Cenário':['Scene','Escenario'],'Luz e sombra':['Light & shadows','Luz y sombras'],
 'Câmera':['Camera','Cámara'],'Composição':['Composition','Composición'],
 'Girar 360°':['Spin 360°','Girar 360°'],'Pausar giro':['Pause spin','Pausar giro'],
 'Girar todas 360°':['Spin all 360°','Girar todas 360°'],
 'Mover caneca':['Move mug','Mover taza'],'Mover cenário':['Move scene','Mover escenario'],
 'Centralizar':['Center','Centrar'],'Frente':['Front','Frente'],'Costas':['Back','Atrás'],
 'Lateral / Alça':['Side / Handle','Lateral / Asa'],'Perspectiva 3D':['3D perspective','Perspectiva 3D'],
 'Topo / Interior':['Top / Inside','Arriba / Interior'],
 'Resetar tudo':['Reset all','Reiniciar todo'],'Guia do Studio':['Studio guide','Guía del Studio'],
 'Privacidade':['Privacy','Privacidad'],'Arquivos locais':['Local files','Archivos locales'],
 'Publicado pelo Admin':['Published by admin','Publicado por Admin'],
 'Pré-visualizar':['Preview','Vista previa'],'Novo comunicado':['New announcement','Nuevo aviso'],
 'Criar comunicado':['Create announcement','Crear aviso'],
 'Salvar comunicado':['Save announcement','Guardar aviso'],
 'Todas as ferramentas':['All tools','Todas las herramientas'],
 'Sombreamento':['Shadows','Sombras'],'Remover sombra':['Remove shadow','Quitar sombra'],
 'Ordem dos objetos':['Object order','Orden de objetos'],
 'Trazer à frente':['Bring to front','Traer al frente'],
 'Subir 1 camada':['Move forward','Subir una capa'],
 'Descer 1 camada':['Move backward','Bajar una capa'],
 'Enviar para trás':['Send to back','Enviar al fondo'],
 'Espelhar o elemento':['Flip element','Voltear elemento'],
 'Horizontal':['Horizontal','Horizontal'],
 'Vertical':['Vertical','Vertical'],
 'Luz/sombra':['Light/shadow','Luz/sombra'],
 'Resetar':['Reset','Restablecer'],
 'Efeitos e acabamentos':['Effects & finishes','Efectos y acabados'],
 'Encaixe inteligente':['Smart placement','Colocación inteligente'],
 'Recupere a posição e a proporção da caneca neste cenário, mantendo a máscara de primeiro plano.':['Restore the mug position and proportions in this scene while keeping its foreground mask.','Restaura la posición y las proporciones de la taza en esta escena, manteniendo su máscara frontal.'],
 'Tipo de máscara':['Mask type','Tipo de máscara'],
 'Preto e branco · branco revela':['Black/white · white reveals','Blanco/negro · blanco muestra'],
 'Transparência do PNG · opaco revela':['PNG transparency · opaque reveals','Transparencia PNG · opaco muestra'],
 'Inverter área visível':['Invert visible area','Invertir área visible'],
 'Máscara não destrutiva: escolha preto/branco ou transparência do PNG. Ideal para mãos e objetos na frente da caneca.':['Non-destructive mask: choose black/white or PNG transparency. Ideal for hands and objects in front of a mug.','Máscara no destructiva: elige blanco/negro o transparencia PNG. Ideal para manos y objetos delante de la taza.'],
 'Limpar máscara':['Clear mask','Quitar máscara'],
 'Máscara de imagem':['Image mask','Máscara de imagen'],
 'Reencaixar caneca':['Refit mug','Reencajar taza'],
 'Testar compatibilidade do MP4':['Check MP4 compatibility','Verificar compatibilidad MP4'],
 'Verificando vídeo…':['Checking video…','Verificando video…'],
 'Compatibilidade inicial confirmada':['Initial compatibility confirmed','Compatibilidad inicial confirmada'],
 'A exportação completa depende também da memória e do hardware.':['Full export also depends on device memory and hardware.','La exportación completa también depende de la memoria y el hardware.'],
 'Verificação não passou':['Compatibility check failed','La verificación no pasó'],
 'Falha desconhecida':['Unknown error','Error desconocido'],
 'Caneca reenquadrada no template.':['Mug refitted to the template.','Taza reencajada en la plantilla.'],
};
const extraWords:Record<string,[string,string]> = {
 "Camadas da composição": ["Composition layers", "Capas de la composición"],
 "Selecione a caneca, o primeiro plano ou o fundo. Olho: ocultar sem apagar. Cadeado: proteger contra alterações.": ["Select the mug, foreground or background. Eye: hide without deleting. Lock: prevent edits.", "Selecciona la taza, el primer plano o el fondo. Ojo: ocultar sin borrar. Candado: impedir cambios."],
 "Camadas ocultas não aparecem na exportação. Selecione fundo e primeiro plano aqui, mesmo quando ocuparem a tela inteira.": ["Hidden layers are excluded from exports. Select foreground and background here, even when they cover the entire canvas.", "Las capas ocultas no aparecen al exportar. Selecciona fondo y primer plano aquí, aunque ocupen todo el lienzo."],
 "100% para canecas · uploads temporários somente neste navegador": [
  "100% for mugs · uploads remain temporarily in this browser",
  "100% para tazas · archivos temporales solo en este navegador"
 ],
 "CRIAR COM LIBERDADE": [
  "CREATE FREELY",
  "CREA LIBREMENTE"
 ],
 "Tipografia": [
  "Typography",
  "Tipografía"
 ],
 "Personagens & Emojis": [
  "Characters & Emojis",
  "Personajes y Emojis"
 ],
 "Biblioteca de Ícones": [
  "Icon Library",
  "Biblioteca de Iconos"
 ],
 "Objetos Vetoriais": [
  "Vector Objects",
  "Objetos Vectoriales"
 ],
 "Seus arquivos": [
  "Your files",
  "Tus archivos"
 ],
 "ACERVO ADMINISTRATIVO": [
  "ADMIN LIBRARY",
  "BIBLIOTECA ADMINISTRATIVA"
 ],
 "LAYOUTS EDITÁVEIS INCLUSOS": [
  "INCLUDED EDITABLE LAYOUTS",
  "DISEÑOS EDITABLES INCLUIDOS"
 ],
 "Comece por um layout": [
  "Start with a layout",
  "Empieza con un diseño"
 ],
 "Escolha um dos 4 layouts editáveis ou use templates publicados pelo admin.": [
  "Choose one of four editable layouts or admin-published templates.",
  "Elige uno de los cuatro diseños editables o plantillas publicadas por el administrador."
 ],
 "FUNDOS PRONTOS SEM TEXTO · PARA SUBLIMAÇÃO": [
  "READY-TO-USE BACKGROUNDS · NO TEXT",
  "FONDOS LISTOS SIN TEXTO · PARA SUBLIMACIÓN"
 ],
 "CORES & TRANSPARÊNCIA": [
  "COLORS & TRANSPARENCY",
  "COLORES Y TRANSPARENCIA"
 ],
 "Carregar mais": [
  "Load more",
  "Cargar más"
 ],
 "Sem itens publicados nessa categoria. Adicione materiais pelo Painel Admin.": [
  "No published items in this category. Add assets through Admin.",
  "No hay elementos publicados en esta categoría. Agrégalos desde el panel de administración."
 ],
 "Propriedades": [
  "Properties",
  "Propiedades"
 ],
 "AJUSTES DE PRECISÃO": [
  "PRECISION CONTROLS",
  "AJUSTES DE PRECISIÓN"
 ],
 "Personalize cada detalhe": [
  "Customize every detail",
  "Personaliza cada detalle"
 ],
 "Clique em um elemento na arte para ajustar tamanho, posição, cores, efeitos e sombras.": [
  "Select an element to adjust size, position, colors, effects, and shadows.",
  "Selecciona un elemento para ajustar tamaño, posición, colores, efectos y sombras."
 ],
 "Para começar, adicione um texto, imagem ou template no painel esquerdo.": [
  "Start by adding text, an image, or a template from the left panel.",
  "Comienza agregando texto, una imagen o una plantilla desde el panel izquierdo."
 ],
 "Conteúdo": [
  "Content",
  "Contenido"
 ],
 "Fonte": [
  "Font",
  "Fuente"
 ],
 "Alinhar": [
  "Align",
  "Alinear"
 ],
 "Posição X": [
  "X position",
  "Posición X"
 ],
 "Posição Y": [
  "Y position",
  "Posición Y"
 ],
 "Largura": [
  "Width",
  "Ancho"
 ],
 "Altura": [
  "Height",
  "Alto"
 ],
 "COR DOS ÍCONES": [
  "ICON COLOR",
  "COLOR DE ICONOS"
 ],
 "COR DOS OBJETOS": [
  "OBJECT COLOR",
  "COLOR DE OBJETOS"
 ],
 "RECOLORIR ÍCONE / SVG MONOCROMÁTICO": [
  "RECOLOR MONOCHROME ICON / SVG",
  "RECOLOREAR ICONO / SVG MONOCROMO"
 ],
 "Capturar cor": [
  "Pick color",
  "Capturar color"
 ],
 "Original": [
  "Original",
  "Original"
 ],
 "A coloração altera toda a silhueta. Para fotos, mantenha a cor original.": [
  "Tint recolors the full silhouette. Keep original colors for photographs.",
  "El tinte recolorea toda la silueta. Para fotos, conserva los colores originales."
 ],
 "Proporção protegida: arraste os 4 cantos sem distorcer as letras.": [
  "Aspect ratio locked: drag the four corners without stretching the letters.",
  "Proporción bloqueada: arrastra las cuatro esquinas sin deformar las letras."
 ],
 "Proporção protegida: arraste os 4 cantos sem distorcer a imagem.": [
  "Aspect ratio locked: drag the four corners without stretching the image.",
  "Proporción bloqueada: arrastra las cuatro esquinas sin deformar la imagen."
 ],
 "Limpar recorte": [
  "Clear crop",
  "Borrar recorte"
 ],
 "RECORTE SEM PERDER O ORIGINAL": [
  "NON-DESTRUCTIVE CROP",
  "RECORTE NO DESTRUCTIVO"
 ],
 "Esquerda": [
  "Left",
  "Izquierda"
 ],
 "Direita": [
  "Right",
  "Derecha"
 ],
 "Superior": [
  "Top",
  "Superior"
 ],
 "Inferior": [
  "Bottom",
  "Inferior"
 ],
 "EFEITOS E ACABAMENTOS": [
  "EFFECTS & FINISHES",
  "EFECTOS Y ACABADOS"
 ],
 "Sem sombra": [
  "No shadow",
  "Sin sombra"
 ],
 "Suave": [
  "Soft",
  "Suave"
 ],
 "Realista": [
  "Realistic",
  "Realista"
 ],
 "TIPOGRAFIA AVANÇADA": [
  "ADVANCED TYPOGRAPHY",
  "TIPOGRAFÍA AVANZADA"
 ],
 "Curvatura": [
  "Curvature",
  "Curvatura"
 ],
 "Ondulação": [
  "Wave",
  "Ondulación"
 ],
 "Profundidade 3D": [
  "3D depth",
  "Profundidad 3D"
 ],
 "Espaço entre letras": [
  "Letter spacing",
  "Espaciado entre letras"
 ],
 "Contorno": [
  "Outline",
  "Contorno"
 ],
 "Cor do contorno": [
  "Outline color",
  "Color del contorno"
 ],
 "Brilho": [
  "Brightness",
  "Brillo"
 ],
 "Contraste": [
  "Contrast",
  "Contraste"
 ],
 "Saturação": [
  "Saturation",
  "Saturación"
 ],
 "Desfoque": [
  "Blur",
  "Desenfoque"
 ],
 "Cinza": [
  "Grayscale",
  "Escala de grises"
 ],
 "Sépia": [
  "Sepia",
  "Sepia"
 ],
 "Matiz": [
  "Hue",
  "Matiz"
 ],
 "Perspectiva / Inclinação": [
  "Perspective / Skew",
  "Perspectiva / Inclinación"
 ],
 "Selecione uma imagem ou texto. Os efeitos serão aplicados no elemento escolhido, sem alterar o arquivo original.": [
  "Select an image or text. Effects are applied without changing the original file.",
  "Selecciona una imagen o texto. Los efectos se aplican sin modificar el archivo original."
 ],
 "Foto nítida": [
  "Sharp photo",
  "Foto nítida"
 ],
 "Vibrante": [
  "Vibrant",
  "Vibrante"
 ],
 "Vintage": [
  "Vintage",
  "Vintage"
 ],
 "Preto & branco": [
  "Black & white",
  "Blanco y negro"
 ],
 "Sombra premium": [
  "Premium shadow",
  "Sombra premium"
 ],
 "Sombra intensa": [
  "Strong shadow",
  "Sombra intensa"
 ],
 "Resetar efeitos": [
  "Reset effects",
  "Restablecer efectos"
 ],
 "Adicionar imagens": [
  "Add images",
  "Agregar imágenes"
 ],
 "Seus arquivos, seu navegador": [
  "Your files, your browser",
  "Tus archivos, tu navegador"
 ],
 "ÁREA VISÍVEL · 19 × 8,5 cm": [
  "VISIBLE AREA · 19 × 8.5 cm",
  "ÁREA VISIBLE · 19 × 8,5 cm"
 ],
 "Começar uma nova arte?": [
  "Start a new design?",
  "¿Empezar un nuevo diseño?"
 ],
 "Os elementos, os fundos e o histórico de desfazer desta composição serão limpos. Arquivos exportados e projetos salvos anteriormente no navegador não serão apagados.": [
  "All elements, backgrounds, and undo history in this composition will be cleared. Previously exported or saved projects are not deleted.",
  "Se borrarán los elementos, fondos y el historial de deshacer de esta composición. Los archivos exportados y proyectos guardados no se eliminarán."
 ],
 "O histórico fica temporariamente neste dispositivo, por até 14 dias, sujeito à limpeza automática do navegador. Nenhum arquivo é enviado ao servidor. Exporte .cgdesign para ter um backup confiável.": [
  "History stays temporarily on this device for up to 14 days and may be cleared by the browser. No file is uploaded. Export .cgdesign for a reliable backup.",
  "El historial permanece temporalmente en este dispositivo hasta 14 días y el navegador puede borrarlo. No se sube ningún archivo. Exporta .cgdesign como copia de seguridad."
 ],
 "Salvar composição atual": [
  "Save current composition",
  "Guardar composición actual"
 ],
 "Voltar às ferramentas": [
  "Back to tools",
  "Volver a herramientas"
 ],
 "Um cenário para cada ideia": [
  "A scene for every idea",
  "Un escenario para cada idea"
 ],
 "Explore layouts profissionais e componha suas canecas para redes sociais, vitrines e divulgação. Publique novos modelos diretamente pelo painel Admin.": [
  "Explore layouts for social media and product showcases. Publish new templates through Admin.",
  "Explora diseños para redes sociales y vitrinas. Publica nuevas plantillas desde el panel de administración."
 ],
 "Criar do zero": [
  "Create from scratch",
  "Crear desde cero"
 ],
 "Guia de canecas": [
  "Mug guide",
  "Guía de tazas"
 ],
 "Todos": [
  "All",
  "Todos"
 ],
 "modelos": [
  "models",
  "modelos"
 ],
 "LAYOUTS EDITÁVEIS DA PLATAFORMA": [
  "PLATFORM EDITABLE LAYOUTS",
  "DISEÑOS EDITABLES DE LA PLATAFORMA"
 ],
 "TEMPLATES DA BIBLIOTECA ADMINISTRATIVA": [
  "ADMIN TEMPLATE LIBRARY",
  "PLANTILLAS DE LA BIBLIOTECA ADMINISTRATIVA"
 ],
 "Nenhum template administrativo publicado ainda.": [
  "No admin templates published yet.",
  "Todavía no hay plantillas publicadas."
 ],
 "Importe imagens e MP4 pelo Painel Admin → Biblioteca Criativa. Os templates publicados aparecem automaticamente nesta página.": [
  "Import images and MP4 through Admin → Creative Library. Published templates appear here automatically.",
  "Importa imágenes y MP4 en Administración → Biblioteca Creativa. Las plantillas aparecen aquí automáticamente."
 ],
 "Abrir Editor de Artes": [
  "Open Art Editor",
  "Abrir Editor de Artes"
 ],
 "Anterior": [
  "Previous",
  "Anterior"
 ],
 "Próxima": [
  "Next",
  "Siguiente"
 ],
 "Página": [
  "Page",
  "Página"
 ],
 "SUAS FONTES · USO NESTE NAVEGADOR": [
  "YOUR FONTS · BROWSER ONLY",
  "TUS FUENTES · SOLO EN ESTE NAVEGADOR"
 ],
 "Carregar fontes particulares": [
  "Load your fonts",
  "Cargar tus fuentes"
 ],
 "Importe TTF, OTF, WOFF ou WOFF2, individualmente ou em ZIP. O arquivo não será enviado ao servidor. Reimporte após atualizar a página; mantenha seus originais. RAR deve ser extraído antes do uso.": [
  "Import TTF, OTF, WOFF or WOFF2 directly or in a ZIP file. Files stay in this browser. Reimport after refreshing and keep the originals. Extract RAR files first.",
  "Importa TTF, OTF, WOFF o WOFF2 directamente o en ZIP. Los archivos permanecen en este navegador. Vuelve a importarlos tras actualizar. Extrae los RAR antes."
 ],
 "FONTES DO ADMIN": [
  "ADMIN FONTS",
  "FUENTES DEL ADMIN"
 ],
 "GOOGLE FONTS · CURADORIA LIVRE": [
  "GOOGLE FONTS · OPEN CURATION",
  "GOOGLE FONTS · SELECCIÓN ABIERTA"
 ],
 "Acentos verificados": [
  "Accents verified",
  "Acentos verificados"
 ],
 "Sem acentos": [
  "No accents",
  "Sin acentos"
 ],
 "Acentos parciais": [
  "Partial accents",
  "Acentos parciales"
 ],
 "Acentos não verificados": [
  "Accents unverified",
  "Acentos no verificados"
 ],
 "BIBLIOTECA CRIATIVA": [
  "CREATIVE LIBRARY",
  "BIBLIOTECA CREATIVA"
 ],
 "Local": [
  "Local",
  "Local"
 ]
};
const studioWords:Record<string,[string,string]> = {
 "Camadas": [
  "Layers",
  "Capas"
 ],
 "Menos": [
  "Less",
  "Menos"
 ],
 "Mais": [
  "More",
  "Más"
 ],
 "Assistente de sublimação": [
  "Sublimation assistant",
  "Asistente de sublimación"
 ],
 "Arquivo de projeto": [
  "Project file",
  "Archivo de proyecto"
 ],
 "Acabamento rápido da caneca": [
  "Quick mug finish",
  "Acabado rápido de taza"
 ],
 "Cores prontas": [
  "Preset colors",
  "Colores predefinidos"
 ],
 "Bases de apoio": [
  "Display bases",
  "Bases de apoyo"
 ],
 "Poses prontas": [
  "Position presets",
  "Posiciones predefinidas"
 ],
 "Avançado (Modo Manual)": [
  "Advanced (Manual mode)",
  "Avanzado (Modo manual)"
 ],
 "Cerâmica e acabamento": [
  "Ceramic and finish",
  "Cerámica y acabado"
 ],
 "Ajustes de cor da arte": [
  "Artwork color adjustments",
  "Ajustes de color del diseño"
 ],
 "Mais opções da arte": [
  "More artwork options",
  "Más opciones del diseño"
 ],
 "Modelo da alça": [
  "Handle model",
  "Modelo del asa"
 ],
 "Original": [
  "Original",
  "Original"
 ],
 "Referência 325 ml": [
  "325 ml reference",
  "Referencia 325 ml"
 ],
 "Arredondada": [
  "Rounded",
  "Redondeada"
 ],
 "Com colher": [
  "With spoon",
  "Con cuchara"
 ],
 "Coração assimétrico": [
  "Asymmetric heart",
  "Corazón asimétrico"
 ],
 "Coração": [
  "Heart",
  "Corazón"
 ],
 "Oval": [
  "Oval",
  "Oval"
 ],
 "Clássica e compacta": [
  "Classic and compact",
  "Clásica y compacta"
 ],
 "Perfil D 325 ml · inspirado na foto": [
  "325 ml D profile · photo-inspired",
  "Perfil D 325 ml · inspirado en la foto"
 ],
 "Formato D · alongada": [
  "Long D shape",
  "Forma D alargada"
 ],
 "Alça D + colher encaixada": [
  "D handle + spoon",
  "Asa D con cuchara"
 ],
 "Recorte superior · azul": [
  "Upper cutout · blue",
  "Recorte superior · azul"
 ],
 "Dois arcos · rosa": [
  "Two curves · pink",
  "Dos curvas · rosa"
 ],
 "Perfil oval · cerâmica": [
  "Oval profile · ceramic",
  "Perfil oval · cerámica"
 ],
 "Alça em 3D com acabamento de cerâmica. A escolha vale somente para esta caneca.": [
  "3D ceramic handle. This choice applies only to this mug.",
  "Asa cerámica 3D. Esta elección se aplica solo a esta taza."
 ]
};
const translations={pt:{title:'Escolha seu idioma',subtitle:'Selecione como deseja navegar pela Click & Gruda.',required:'Selecione um idioma para continuar.',button:'Continuar',switch:'Idioma',privacy:'Sua escolha fica salva somente neste navegador.'},en:{title:'Choose your language',subtitle:'Select your preferred language for Click & Gruda.',required:'Select a language to continue.',button:'Continue',switch:'Language',privacy:'Your choice is saved only in this browser.'},es:{title:'Elige tu idioma',subtitle:'Selecciona tu idioma para navegar por Click & Gruda.',required:'Selecciona un idioma para continuar.',button:'Continuar',switch:'Idioma',privacy:'Tu elección se guarda solo en este navegador.'}};
const Context=createContext<{language:SiteLanguage;choose:(lang:SiteLanguage)=>void;t:(s:string)=>string}>({language:'pt',choose:()=>{},t:s=>s});
export const usePlatformLanguage=()=>useContext(Context);
export function LanguageProvider({children}:{children:ReactNode}){
 const [selected,setSelected]=useState<SiteLanguage|null>(null);
 const [ready,setReady]=useState(false);
 const [open,setOpen]=useState(false);
 const [pending,setPending]=useState<SiteLanguage>('pt');
 useEffect(()=>{try{const stored=localStorage.getItem(STORAGE_KEY);if(stored==='pt'||stored==='en'||stored==='es'){setSelected(stored);setPending(stored);}else setOpen(true);}catch{setOpen(true);}setReady(true)},[]);
 const choose=useCallback((language:SiteLanguage)=>{setSelected(language);setPending(language);setOpen(false);try{localStorage.setItem(STORAGE_KEY,language)}catch{/* browser may refuse persistence */}document.documentElement.lang=language==='pt'?'pt-BR':language==='en'?'en':'es';},[]);
 useEffect(()=>{if(selected)document.documentElement.lang=selected==='pt'?'pt-BR':selected;},[selected]);
 const current=selected||'pt';
 const t=useCallback((input:string)=>current==='pt'?input:(words[input]||extraWords[input]||studioWords[input])?.[current==='en'?0:1]??input,[current]);
 return <Context.Provider value={{language:current,choose,t}}>{children}
 {ready&&selected&&<button type="button" className="cg-language-switch" aria-label={translations[current].switch} title={translations[current].switch} onClick={()=>{setPending(selected);setOpen(true)}}><Globe2 size={16}/><span>{current.toUpperCase()}</span></button>}
 {ready&&open&&<div className="cg-language-cover" role="presentation"><section className="cg-language-modal" role="dialog" aria-modal="true" aria-labelledby="cg-language-title">
 <div className="cg-language-mark"><Languages size={24}/><span>Click <b>&</b> Gruda</span></div>
 {selected&&<button className="cg-language-close" onClick={()=>setOpen(false)} aria-label="Close"><X size={21}/></button>}
 <span className="cg-language-eyebrow">WELCOME · BIENVENIDO · BEM-VINDO</span>
 <h2 id="cg-language-title">{translations[pending].title}</h2><p>{translations[pending].subtitle}</p>
 <div className="cg-language-grid">{LANGUAGES.map(item=><button type="button" key={item.id} className={`cg-language-choice ${pending===item.id?'selected':''}`} aria-pressed={pending===item.id} onClick={()=>setPending(item.id)}><span className="cg-language-flag" aria-hidden="true">{item.flag}</span><strong>{item.name}</strong><small>{item.detail}</small>{pending===item.id&&<Check size={18} className="cg-language-check"/>}</button>)}</div>
 <button className="cg-language-continue" onClick={()=>choose(pending)}>{translations[pending].button}</button><small className="cg-language-fineprint">{translations[pending].privacy}</small>
 </section></div>}
 </Context.Provider>
}
