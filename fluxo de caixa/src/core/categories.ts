// Categorias de lançamento. '' = sem categoria.
export const CATEGORIES = [
  'Cliente',
  'Serviço',
  'Financiamento',
  'Cartão',
  'Gasto fixo',
  'Temporário',
  'Empréstimo de banco',
] as const;

// Uma cor por categoria (a "bolinha" na lista / ao lado do seletor).
export function categoryColor(cat: string): string {
  switch (cat) {
    case 'Cliente': return '#3ddc84';
    case 'Serviço': return '#5b9dff';
    case 'Financiamento': return '#ffc15e';
    case 'Cartão': return '#ff6b6b';
    case 'Gasto fixo': return '#9a6cff';
    case 'Temporário': return '#ff8a3d';
    case 'Empréstimo de banco': return '#b5835a';
    default: return '#8b93a1';
  }
}

// Emoji de bolinha colorida (usado dentro do <select>, que não aceita cor por HTML).
export function categoryEmoji(cat: string): string {
  switch (cat) {
    case 'Cliente': return '🟢';
    case 'Serviço': return '🔵';
    case 'Financiamento': return '🟡';
    case 'Cartão': return '🔴';
    case 'Gasto fixo': return '🟣';
    case 'Temporário': return '🟠';
    case 'Empréstimo de banco': return '🟤';
    default: return '⚪';
  }
}
