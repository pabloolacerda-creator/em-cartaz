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

// Uma cor por categoria (a "bolinha" colorida).
export function categoryColor(cat: string): string {
  switch (cat) {
    case 'Cliente': return '#3ddc84';
    case 'Serviço': return '#5b9dff';
    case 'Financiamento': return '#ffc15e';
    case 'Cartão': return '#ff6b6b';
    case 'Gasto fixo': return '#9a6cff';
    case 'Temporário': return '#4dd0e1';
    case 'Empréstimo de banco': return '#ff8a3d';
    default: return '#8b93a1';
  }
}
