export function parseInstagramCaption(
  caption: string
) {

  const lines =
    caption.split('\n');

  // Nombre
  const nombre =
    lines[0]
      ?.replace('✨', '')
      .trim() || '';

  // Precio
  const precioMatch =
    caption.match(
      /Precio:\s*(\d+)/i
    );

  // Stock
  const stockMatch =
    caption.match(
      /Stock:\s*(\d+)/i
    );

  // Categoría
  const categoriaMatch =
    caption.match(
      /Categoria:\s*(collares|aretes|pulseras)/i
    );

  // Código
  const codigoMatch =
    caption.match(
      /Codigo:\s*([A-Z0-9-]+)/i
    );

  // Descripción limpia
  const descripcion =
    lines
      .filter(line =>
        !line.includes('Precio:') &&
        !line.includes('Stock:') &&
        !line.includes('Categoria:') &&
        !line.includes('Codigo:')
      )
      .slice(1)
      .join('\n')
      .trim();

  return {

    nombre,

    descripcion,

    precio:
      precioMatch
        ? Number(precioMatch[1])
        : 0,

    stock:
      stockMatch
        ? Number(stockMatch[1])
        : 0,

    categoria:
      categoriaMatch
        ? categoriaMatch[1].toLowerCase()
        : 'collares',

    codigo:
      codigoMatch
        ? codigoMatch[1]
        : null,
  };
}