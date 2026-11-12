window.SW = window.SW || {};
SW.categories = {
  people: {
    label: 'Personagens', summary: ['birth_year','height'],
    fields: {
      birth_year: 'Ano de nascimento', height: 'Altura', mass: 'Massa', gender: 'Gênero',
      hair_color: 'Cor do cabelo', skin_color: 'Cor da pele', eye_color: 'Cor dos olhos'
    },
    relations: { homeworld: 'Planeta natal', films: 'Filmes', species: 'Espécies', starships: 'Naves', vehicles: 'Veículos' }
  },
  planets: {
    label: 'Planetas', summary: ['climate','terrain'],
    fields: { rotation_period:'Período de rotação', orbital_period:'Período orbital', diameter:'Diâmetro', climate:'Clima', gravity:'Gravidade', terrain:'Terreno', surface_water:'Água na superfície', population:'População' },
    relations: { residents:'Moradores', films:'Filmes' }
  },
  starships: {
    label: 'Naves', summary: ['model','starship_class'],
    fields: { model:'Modelo', manufacturer:'Fabricante', cost_in_credits:'Custo em créditos', length:'Comprimento', max_atmosphering_speed:'Velocidade máxima', crew:'Tripulação', passengers:'Passageiros', cargo_capacity:'Capacidade de carga', consumables:'Suprimentos', hyperdrive_rating:'Classificação hiperdrive', MGLT:'MGLT', starship_class:'Classe da nave' },
    relations: { pilots:'Pilotos', films:'Filmes' }
  },
  vehicles: {
    label: 'Veículos', summary: ['model','vehicle_class'],
    fields: { model:'Modelo', manufacturer:'Fabricante', cost_in_credits:'Custo em créditos', length:'Comprimento', max_atmosphering_speed:'Velocidade máxima', crew:'Tripulação', passengers:'Passageiros', cargo_capacity:'Capacidade de carga', consumables:'Suprimentos', vehicle_class:'Classe do veículo' },
    relations: { pilots:'Pilotos', films:'Filmes' }
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
