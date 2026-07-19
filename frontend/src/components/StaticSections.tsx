import { WhatsAppLink } from './WhatsAppLink';

interface HeroProps {
  whatsLinkNumber: string;
}

export function Hero({ whatsLinkNumber }: HeroProps) {
  return (
    <section className="hero-section">
      <div className="hero-media" aria-hidden="true">
        <img src="/images/equipe.webp" alt="" width="2016" height="2488" fetchPriority="high" decoding="async" />
      </div>
      <div className="container-fluid hero-shell">
        <div className="hero-copy">
          <span className="kicker">Advocacia para momentos decisivos</span>
          <h1>Quando o problema é sério, sua defesa precisa ser séria desde o primeiro contato.</h1>
          <p>
            A Dias & Kovaltchuk une análise técnica, resposta rápida e acompanhamento próximo para conduzir demandas
            criminais, cíveis, familiares, trabalhistas, previdenciárias, de saúde e consumidor.
          </p>
          <div className="hero-actions">
            <WhatsAppLink number={whatsLinkNumber} className="primary-action wa-track">
              <i className="bi bi-whatsapp" /> Quero atendimento agora
            </WhatsAppLink>
            <a className="secondary-action" href="#contact">
              Enviar meu caso <i className="bi bi-arrow-down" />
            </a>
          </div>
        </div>
        <aside className="decision-card" aria-label="Atendimento jurídico">
          <h2>Diagnóstico inicial com direção clara.</h2>
          <p>Você explica o cenário. O escritório aponta riscos, prioridades e próximos passos possíveis.</p>
          <div className="decision-list">
            <span>
              <i className="bi bi-check2" /> Atendimento humanizado
            </span>
            <span>
              <i className="bi bi-check2" /> Estratégia por área
            </span>
            <span>
              <i className="bi bi-check2" /> Comunicação objetiva
            </span>
          </div>
        </aside>
      </div>
      <div className="trust-strip" aria-label="Diferenciais do escritório">
        <div>
          <strong>2023</strong>
          <span>Atendimento online e estratégico</span>
        </div>
        <div>
          <strong>7 áreas</strong>
          <span>Atuação completa para pessoas físicas</span>
        </div>
        <div>
          <strong>2 sócias</strong>
          <span>Condução direta por advogadas fundadoras</span>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section className="section intro-section" id="about">
      <div className="container">
        <div className="split-heading">
          <span className="kicker">O escritório</span>
          <h2>Uma advocacia que combina postura firme com escuta cuidadosa.</h2>
          <p>
            Fundada por Larissa de Souza Dias, OAB/SC 62.170, e Vitória Igarçaba Kovaltchuk, OAB/SC 67.779, a Dias &
            Kovaltchuk atua de forma contenciosa, preventiva e consultiva com ética, transparência e atenção real ao
            detalhe.
          </p>
        </div>
        <div className="value-grid">
          <article>
            <span>01</span>
            <h3>Clareza antes de qualquer movimento</h3>
            <p>Você entende o que está em jogo, quais caminhos existem e o que precisa ser feito primeiro.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Estratégia ajustada ao caso</h3>
            <p>Cada demanda é tratada com leitura própria, sem respostas genéricas para problemas sensíveis.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Presença durante o processo</h3>
            <p>Acompanhamento próximo, linguagem acessível e orientação para decisões com segurança.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

const practiceAreas = [
  [
    'bi-file-earmark-text',
    'Direito Civil',
    'Cobranças, contratos, responsabilidade civil, obrigações, posse, propriedade e usucapião.'
  ],
  [
    'bi-people',
    'Família e Sucessões',
    'Divórcio, partilha, união estável, alimentos, guarda, paternidade e inventários.'
  ],
  [
    'bi-heart-pulse',
    'Direito à Saúde',
    'Planos de saúde, medicamentos, responsabilidade médica e pedidos liminares urgentes.'
  ],
  [
    'bi-bag-check',
    'Consumidor',
    'Ações, defesas e acompanhamento no Procon, Ministério Público, Juizados e Justiça Comum.'
  ],
  [
    'bi-briefcase',
    'Trabalhista',
    'Processos individuais e coletivos, audiências, acordos e indenizações por acidente laboral.'
  ],
  [
    'bi-clipboard2-check',
    'Previdenciário',
    'Aposentadorias, pensões, auxílio-doença, revisões e conversão de benefícios.'
  ]
];

export function Practice() {
  return (
    <section className="section practice-section" id="acting">
      <div className="container">
        <div className="section-title">
          <span className="kicker">Áreas de atuação</span>
          <h2>Um escritório preparado para proteger o que não pode esperar.</h2>
        </div>
        <div className="practice-board">
          <article className="practice-tile large">
            <i className="bi bi-shield-lock practice-icon" aria-hidden="true" />
            <span>Tribunal do Júri, investigação e processo penal</span>
            <h3>Direito Criminal</h3>
            <p>
              Defesa técnica em crimes contra a vida, inquéritos, processos, execução penal e instâncias comuns ou
              federais.
            </p>
          </article>
          {practiceAreas.map(([icon, title, description]) => (
            <article className="practice-tile" key={title}>
              <i className={`bi ${icon} practice-icon`} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Process() {
  return (
    <section className="section process-section">
      <div className="container process-grid">
        <div>
          <span className="kicker">Como funciona</span>
          <h2>Você não fica no escuro.</h2>
        </div>
        <div className="process-steps">
          <article>
            <strong>1</strong>
            <h3>Contato inicial</h3>
            <p>Você envia a situação pelo WhatsApp ou formulário com os dados essenciais.</p>
          </article>
          <article>
            <strong>2</strong>
            <h3>Análise do cenário</h3>
            <p>O escritório identifica urgências, riscos, documentos e medidas possíveis.</p>
          </article>
          <article>
            <strong>3</strong>
            <h3>Plano de ação</h3>
            <p>Você recebe uma orientação clara para decidir os próximos passos com segurança.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function Team() {
  return (
    <section className="section team-section" id="team">
      <div className="container">
        <div className="section-title">
          <span className="kicker">Advogadas</span>
          <h2>Duas sócias, uma condução direta e responsável.</h2>
        </div>
        <div className="team-showcase">
          <article className="profile-card">
            <img
              src="/images/larry.webp"
              alt="Dra. Larissa de Souza Dias"
              width="1400"
              height="2100"
              loading="lazy"
              decoding="async"
            />
            <div>
              <span>Sócia-fundadora</span>
              <h3>Dra. Larissa de Souza Dias</h3>
              <p>
                Bacharela em Direito pela Faculdade Cesusc, inscrita na OAB/SC 62.170, especialista em Prática Penal
                Avançada e pós-graduada em Direito de Família e Sucessões pela Faculdade IBMEC.
              </p>
            </div>
          </article>
          <article className="profile-card">
            <img
              src="/images/vik.webp"
              alt="Dra. Vitória Igarçaba Kovaltchuk"
              width="1400"
              height="2100"
              loading="lazy"
              decoding="async"
            />
            <div>
              <span>Sócia-fundadora</span>
              <h3>Dra. Vitória Igarçaba Kovaltchuk</h3>
              <p>
                Bacharela em Direito pela Universidade do Sul de Santa Catarina, inscrita na OAB/SC 67.779, pós-graduada
                em Direito Penal e Processual Penal pela EBRADI e pós-graduanda em Direito de Família e Sucessões pela
                PUC-MG.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
