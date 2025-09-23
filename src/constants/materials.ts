export interface Material {
    id: string;
    nombre: string;
    descripcion: string;
    categoria: 'sublimacion' | 'laser' | 'ambos';
}

export const MATERIALES_COMUNES: Material[] = [
    // Materiales para Sublimación
    {
        id: 'ceramica',
        nombre: 'Cerámica',
        descripcion: 'Material base para tazas, platos y otros artículos de cerámica',
        categoria: 'sublimacion'
    },
    {
        id: 'poliester',
        nombre: 'Poliéster',
        descripcion: 'Tela sintética ideal para sublimación, usada en playeras y productos textiles',
        categoria: 'sublimacion'
    },
    {
        id: 'aluminio',
        nombre: 'Aluminio con Recubrimiento',
        descripcion: 'Láminas de aluminio con recubrimiento especial para sublimación',
        categoria: 'sublimacion'
    },
    // Materiales para Láser
    {
        id: 'mdf',
        nombre: 'MDF',
        descripcion: 'Tablero de fibra de densidad media para corte y grabado láser',
        categoria: 'laser'
    },
    {
        id: 'acrilico',
        nombre: 'Acrílico',
        descripcion: 'Material plástico transparente o de color para corte y grabado',
        categoria: 'laser'
    },
    {
        id: 'madera',
        nombre: 'Madera',
        descripcion: 'Diversos tipos de madera para corte y grabado',
        categoria: 'laser'
    },
    // Materiales para Ambos
    {
        id: 'metal',
        nombre: 'Metal',
        descripcion: 'Metales tratados que pueden usarse tanto para sublimación como para grabado láser',
        categoria: 'ambos'
    },
    {
        id: 'vidrio',
        nombre: 'Vidrio',
        descripcion: 'Material que puede ser tratado tanto con sublimación como con láser',
        categoria: 'ambos'
    }
];