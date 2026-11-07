'use client';

import {ChevronDown, Download, FolderOpen, History, RotateCcw, Save} from 'lucide-react';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';

type Props = {
 busy: boolean;
 onSave: () => void;
 onBackup: () => void;
 onOpen: () => void;
 onHistory: () => void;
 onReset: () => void;
};

/** Project storage stays separate from exporting a finished artwork. */
export function EditorProjectMenu({busy, onSave, onBackup, onOpen, onHistory, onReset}: Props) {
 return <DropdownMenu>
  <DropdownMenuTrigger asChild><button type="button" className="cr-project-trigger" aria-label="Projeto"><FolderOpen size={16}/><span>Projeto</span><ChevronDown size={13}/></button></DropdownMenuTrigger>
  <DropdownMenuContent align="end" sideOffset={8} className="cr-editor-project-menu">
   <DropdownMenuLabel>Guardar e continuar depois</DropdownMenuLabel>
   <DropdownMenuItem onSelect={onSave}><Save/><span><strong>Salvar no navegador</strong><small>Continuar neste mesmo aparelho</small></span></DropdownMenuItem>
   <DropdownMenuItem onSelect={onBackup} disabled={busy} title="Criar backup portátil com os arquivos do projeto"><Download/><span><strong>Baixar projeto .cgdesign</strong><small>Cópia editável com os arquivos da arte</small></span></DropdownMenuItem>
   <DropdownMenuSeparator/>
   <DropdownMenuItem onSelect={onOpen}><FolderOpen/><span><strong>Abrir projeto</strong><small>Carregar um arquivo .cgdesign</small></span></DropdownMenuItem>
   <DropdownMenuItem onSelect={onHistory}><History/><span><strong>Histórico local</strong><small>Ver projetos salvos neste navegador</small></span></DropdownMenuItem>
   <DropdownMenuSeparator/>
   <DropdownMenuItem onSelect={onReset} variant="destructive"><RotateCcw/><span><strong>Resetar projeto</strong><small>Pede confirmação antes de reiniciar</small></span></DropdownMenuItem>
  </DropdownMenuContent>
 </DropdownMenu>;
}
