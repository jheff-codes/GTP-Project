// Constantes extraídas dos componentes de Imóveis
// Centralizadas para reutilização em filtros, modais e formulários

export const CITIES = [
    'Almirante Tamandaré',
    'Araucária',
    'Campo Largo',
    'Colombo',
    'Curitiba',
    'Fazenda Rio Grande',
    'Pinhais',
    'São José dos Pinhais',
];

export const PROPERTY_TYPES = [
    'Apartamento',
    'Casa',
    'Sobrado',
    'Terreno',
    'Comercial',
    'Rural',
];

export const NEIGHBORHOODS: Record<string, string[]> = {
    'Curitiba': [
        'Abranches', 'Água Verde', 'Ahú', 'Alto Boqueirão', 'Alto da Glória', 'Alto da Rua XV',
        'Atuba', 'Augusta', 'Bacacheri', 'Bairro Alto', 'Bairro Novo', 'Barreirinha', 'Batel',
        'Bigorrilho', 'Boa Vista', 'Bom Retiro', 'Boqueirão', 'Butiatuvinha', 'Cabral', 'Cachoeira',
        'Caiuá', 'Cajuru', 'Campina do Siqueira', 'Campo Comprido', 'Campo de Santana',
        'Capão da Imbuia', 'Capão Raso', 'Carböchlor', 'Cascatinha', 'Caximba', 'Centro',
        'Centro Cívico', 'Champagnat', 'CIC', 'Cidade Industrial', 'Cristo Rei', 'Ecoville',
        'Fanny', 'Fazendinha', 'Ganchinho', 'Guabirotuba', 'Guaíra', 'Hauer', 'Hugo Lange',
        'Jardim Botânico', 'Jardim das Américas', 'Jardim Gabineto', 'Jardim Schaffer',
        'Jardim Social', 'Juvevê', 'Lamenha Pequena', 'Lindóia', 'Mercês', 'Mossunguê',
        'Novo Mundo', 'Orleans', 'Osternack', 'Oswaldo Cruz', 'Parolin', 'Pilarzinho',
        'Pinheirinho', 'Portão', 'Prado Velho', 'Rebouças', 'Rio Bonito', 'Riviera', 'Sabará',
        'Santa Cândida', 'Santa Felicidade', 'Santa Quitéria', 'Santo Inácio', 'São Braz',
        'São Francisco', 'São João', 'São Lourenço', 'São Miguel', 'Seminário', 'Sítio Cercado',
        'Taboão', 'Tarumã', 'Tatuquara', 'Tingui', 'Uberaba', 'Umbará', 'Vila Estrela',
        'Vila Hauer', 'Vila Izabel', 'Vila Nossa Senhora da Luz', 'Vila Oficinas', 'Vila Sandra',
        'Vila Tecnológica', 'Vila Torres', 'Vila Verde', 'Vista Alegre', 'Vitória Régia', 'Xaxim',
    ].sort(),
    'Pinhais': [
        'Alto Tarumã', 'Atuba', 'Centro', 'Emiliano Perneta', 'Estância Pinhais', 'Jardim Amélia',
        'Jardim Cláudia', 'Jardim Karla', 'Maria Antonieta', 'Pineville', 'Vargem Grande',
        'Weissópolis',
    ].sort(),
    'São José dos Pinhais': [
        'Academia', 'Afonso Pena', 'Águas Belas', 'Aristocrata', 'Boneca do Iguaçu', 'Borda do Campo',
        'Cachoeira', 'Centro', 'Cidade Jardim', 'Colônia Rio Grande', 'Costeira', 'Cristal',
        'Cruzeiro', 'Del Rey', 'Guatupê', 'Iná', 'Ipê', 'Miringuava', 'Ouro Fino', 'Parque da Fonte',
        'Pedro Moro', 'Quississana', 'Rio Pequeno', 'São Cristóvão', 'São Domingos', 'São Marcos',
        'São Pedro', 'Urano', 'Zacarias',
    ].sort(),
    'Araucária': [
        'Barigui', 'Boqueirão', 'Cachoeira', 'Campina da Barra', 'Capela Velha', 'Centro',
        'Costeira', 'Estação', 'Fazenda Velha', 'Iguaçu', 'Passaúna', 'Sabiá', 'São Miguel',
        'Thomaz Coelho', 'Tindiquera',
    ].sort(),
    'Colombo': [
        'Alto Maracanã', 'Arruda', 'Atuba', 'Centro', 'Fátima', 'Guaraituba', 'Jardim Osasco',
        'Maracanã', 'Mauá', 'Monza', 'Paloma', 'Rio Verde', 'Roça Grande', 'Santa Tereza',
        'São Gabriel',
    ].sort(),
    'Fazenda Rio Grande': [
        'Centro', 'Eucaliptos', 'Gralha Azul', 'Iguaçu', 'Jardim Veneza', 'Nações', 'Pioneiros',
        'Santa Terezinha', 'Santamaria', 'Estados',
    ].sort(),
    'Campo Largo': [
        'Águas Claras', 'Aparecida', 'Bom Jesus', 'Botiatuva', 'Centro', 'Ferraria', 'Itaqui',
        'Jardim Esmeralda', 'Ouro Verde', 'Partênope', 'Rivabem', 'Rondinha', 'Vila Bancária',
        'Vila Elizabeth', 'Vila Gilcy',
    ].sort(),
    'Almirante Tamandaré': [
        'Bonfim', 'Cachoeira', 'Centro', 'Jardim Gramados', 'Jardim Paraíso', 'Lamenha Grande',
        'Pilarzinho', 'Taboão', 'Tanguá', 'Tranqueira', 'Vila Santa Tavares',
    ].sort(),
};
