/**
 * Utilitários para restaurantes
 */

/**
 * Gera uma URL de imagem aleatória para restaurante usando placeholder
 * @returns URL da imagem aleatória
 */
export function gerarImagemAleatoria(): string {
  const cores = [
    'FF6B6B', // Vermelho
    '4ECDC4', // Teal
    '45B7D1', // Azul
    'FFA07A', // Laranja
    '98D8C8', // Verde claro
    'F7DC6F', // Amarelo
    'BB8FCE', // Roxo
    '85C1E2', // Azul claro
  ];

  const alimentos = [
    '🍕', '🍔', '🍜', '🍱', '🍛', '🍲', '🥘', '🍝', '🍣', '🥗', '🍗', '🌮'
  ];

  const corAleatoria = cores[Math.floor(Math.random() * cores.length)];
  const alimentoAleatorio = alimentos[Math.floor(Math.random() * alimentos.length)];

  // Usando via.placeholder.com com cor e emoji
  return `https://via.placeholder.com/400x200/${corAleatoria}/FFFFFF?text=${encodeURIComponent(alimentoAleatorio + '+Restaurante')}`;
}

export const restaurantesUtils = {
  gerarImagemAleatoria,
};
