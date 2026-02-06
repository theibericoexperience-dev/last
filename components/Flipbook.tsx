
import React, { useState } from 'react';



export default function Flipbook({ pages }) {
  const [page, setPage] = useState(0);

  // Avanza de dos en dos páginas
  const goNext = () => setPage((p) => Math.min(p + 2, pages.length - 2));
  const goPrev = () => setPage((p) => Math.max(p - 2, 0));

  // Páginas a mostrar
  const leftPage = pages[page];
  const rightPage = pages[page + 1];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full h-full flex items-center justify-center">
        <button onClick={goPrev} disabled={page === 0} className="mr-2 px-2 py-1 bg-gray-200 rounded disabled:opacity-50">◀</button>
        <div className="flex w-full h-full">
          <div className="page bg-white p-6 h-full shadow-lg border-r border-gray-200 flex-1 max-w-1/2">
            {leftPage}
          </div>
          <div className="page bg-white p-6 h-full shadow-lg flex-1 max-w-1/2">
            {rightPage}
          </div>
        </div>
        <button onClick={goNext} disabled={page >= pages.length - 2} className="ml-2 px-2 py-1 bg-gray-200 rounded disabled:opacity-50">▶</button>
      </div>
      <div className="mt-2 text-sm text-gray-500">Páginas {page + 1} y {page + 2} de {pages.length}</div>
    </div>
  );
}
