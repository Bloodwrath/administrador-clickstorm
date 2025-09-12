const path = require('path');
const { override, addWebpackAlias } = require('customize-cra');

// Configuración de alias
const addCustomAliases = addWebpackAlias({
  '@components': path.resolve(__dirname, 'src/components'),
  '@modules': path.resolve(__dirname, 'src/modules'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@assets': path.resolve(__dirname, 'src/assets'),
  '@styles': path.resolve(__dirname, 'src/styles'),
  '@context': path.resolve(__dirname, 'src/context'),
  '@hooks': path.resolve(__dirname, 'src/hooks'),
  '@types': path.resolve(__dirname, 'src/types')
});

// Configuración personalizada
module.exports = override(
  // Añadir alias
  addCustomAliases,
  
  // Configuración adicional si es necesario
  (config) => {
    // Configuración personalizada aquí
    return config;
  }
);
