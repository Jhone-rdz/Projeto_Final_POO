import { Link } from 'react-router-dom';

const GOLD = '#C9922A';

/**
 * Componente de Footer — tema escuro ReservaFácil
 */
export const Footer = () => {
  return (
    <footer className="w-full" style={{ backgroundColor: '#1a1a1a', borderTop: `2px solid ${GOLD}` }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Seção principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">

          {/* Marca */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="4" width="24" height="22" rx="3" stroke={GOLD} strokeWidth="2" fill="none" />
                <path d="M2 10h24" stroke={GOLD} strokeWidth="2" />
                <rect x="7" y="2" width="3" height="5" rx="1.5" fill={GOLD} />
                <rect x="18" y="2" width="3" height="5" rx="1.5" fill={GOLD} />
                <path d="M8 16l3 3 6-6" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Georgia', serif" }}>
                ReservaFácil
              </span>
            </div>
            <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.65 }}>
              A forma mais fácil e rápida de reservar sua mesa em restaurantes.
            </p>
          </div>

          {/* Links Úteis */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: '#fff', fontSize: '0.95rem' }}>Links Úteis</h3>
            <ul className="space-y-2">
              {[
                { label: 'Home', to: '/' },
                { label: 'Restaurantes', to: '/restaurants' },
                { label: 'Sobre nós', href: '#' },
                { label: 'Contato', href: '#' },
              ].map(item => (
                <li key={item.label}>
                  {item.to ? (
                    <Link to={item.to} style={{ color: '#888', fontSize: '0.875rem', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                    >{item.label}</Link>
                  ) : (
                    <a href={item.href} style={{ color: '#888', fontSize: '0.875rem', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                    >{item.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: '#fff', fontSize: '0.95rem' }}>Suporte</h3>
            <ul className="space-y-2">
              {['Central de Ajuda', 'FAQ', 'Termos de Serviço', 'Política de Privacidade'].map(item => (
                <li key={item}>
                  <a href="#" style={{ color: '#888', fontSize: '0.875rem', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                  >{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: '#fff', fontSize: '0.95rem' }}>Contato</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:suporte@reservafacil.com"
                  style={{ color: '#888', fontSize: '0.875rem', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                >
                  suporte@reservafacil.com
                </a>
              </li>
              <li>
                <a href="tel:+551133334444"
                  style={{ color: '#888', fontSize: '0.875rem', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                >
                  (11) 3333-4444
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divisor */}
        <hr style={{ borderColor: '#333', borderTopWidth: 1, margin: 0 }} />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center py-6 gap-4">
          <p style={{ color: '#666', fontSize: '0.82rem', fontWeight: 600 }}>
            © 2026 ReservaFácil. Todos os direitos reservados.
          </p>
          <div className="flex gap-5">
            {['Facebook', 'Instagram', 'Twitter'].map(social => (
              <a key={social} href="#"
                style={{ color: '#666', fontSize: '0.82rem', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={e => (e.currentTarget.style.color = '#666')}
              >{social}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};