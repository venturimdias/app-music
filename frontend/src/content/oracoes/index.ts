// Manifesto das Orações Eucarísticas — markdown embutido no bundle (offline por
// padrão). Para adicionar/editar: crie/edite o .md e registre aqui (id, título).
import i from './oracao-eucaristica-i.md?raw';
import ii from './oracao-eucaristica-ii.md?raw';
import iii from './oracao-eucaristica-iii.md?raw';
import iv from './oracao-eucaristica-iv.md?raw';
import v from './oracao-eucaristica-v.md?raw';

export interface Oracao {
  id: string;
  titulo: string;
  conteudo: string;
}

export const ORACOES: Oracao[] = [
  { id: 'i', titulo: 'Oração Eucarística I', conteudo: i },
  { id: 'ii', titulo: 'Oração Eucarística II', conteudo: ii },
  { id: 'iii', titulo: 'Oração Eucarística III', conteudo: iii },
  { id: 'iv', titulo: 'Oração Eucarística IV', conteudo: iv },
  { id: 'v', titulo: 'Oração Eucarística V', conteudo: v },
];
