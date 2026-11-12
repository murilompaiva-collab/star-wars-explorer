window.SW = window.SW || {};
SW.categories = {
  people: {
    label: 'Personagens',
    fields: {
      birth_year: 'Ano de nascimento', height: 'Altura', mass: 'Massa', gender: 'Gênero',
      hair_color: 'Cor do cabelo', skin_color: 'Cor da pele', eye_color: 'Cor dos olhos'
    },
    relations: { homeworld: 'Planeta natal', films: 'Filmes', species: 'Espécies', starships: 'Naves', vehicles: 'Veículos' }
  }
};
// Apenas os valores conhecidos são traduzidos; nomes próprios são preservados.
SW.format = function (value, key) {
  if (value == null || value === '' || value === 'unknown') return 'Não informado';
  if (value === 'n/a') return 'Não se aplica';
  const translations = { male: 'Masculino', female: 'Feminino', none: 'Nenhum', hermaphrodite: 'Hermafrodita', blond: 'Loiro', brown: 'Castanho', black: 'Preto', white: 'Branco', blue: 'Azul', red: 'Vermelho', yellow: 'Amarelo', green: 'Verde', grey: 'Cinza', fair: 'Clara', light: 'Clara', pale: 'Pálida', gold: 'Dourado', auburn: 'Ruivo', hazel: 'Avelã' };
  if (key === 'height') return value + ' cm';
  if (key === 'mass') return value + ' kg';
  if (key === 'birth_year') return value;
  return String(value).split(', ').map(part => translations[part] || part).join(', ');
};
