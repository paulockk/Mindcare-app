import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTerapeutaBySlug,
  getAgendamentosPorTerapeuta,
  createAgendamento,
} from "../../../services/api";
import "./TerapeutaDetalhe.css";
import {
  MapPin,
  Star,
  Calendar,
  Phone,
  User,
  ArrowLeft,
  Map,
} from "lucide-react";
import { useSwipeable } from "react-swipeable";

const DIAS_SEMANA = {
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
};

const SECOES = ["agendar", "sobre", "localizacao", "avaliacoes"];

function gerarProximosDias(diasDisponiveis, quantidade = 14) {
  const dias = [];
  const hoje = new Date();

  for (let i = 0; i < 60 && dias.length < quantidade; i++) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i);

    const diaSemana = data
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    if (diasDisponiveis.includes(diaSemana)) {
      dias.push(data);
    }
  }

  return dias;
}

function formatarData(data) {
  return data.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatarDataISO(data) {
  return data.toISOString().split("T")[0];
}

function renderEstrelas(avaliacao) {
  const cheias = Math.round(avaliacao);
  return "★".repeat(cheias) + "☆".repeat(5 - cheias);
}

function rendeEstrelas(avaliacao) {
  const cheias = Math.round(avaliacao);
  return "★".repeat(cheias) + "☆".repeat(5 - cheias);
}

function TerapeutaDetalhe() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [terapeuta, setTerapeuta] = useState(null);
  const [agendados, setAgendados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [secaoAtiva, setSecaoAtiva] = useState("agendar");

  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [etapa, setEtapa] = useState("calendario");

  const [form, setForm] = useState({ nome: "", celular: "", motivo: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function carregar() {
      const dados = await getTerapeutaBySlug(slug);
      setTerapeuta(dados);

      const agendamentos = await getAgendamentosPorTerapeuta(dados.id);
      setAgendados(agendamentos);

      setLoading(false);
    }
    carregar();
  }, [slug]);

  function horarioOcupado(data, horario) {
    const dataISO = formatarDataISO(data);
    return agendados.some((a) => a.data === dataISO && a.horario === horario);
  }

  function handleSelecionarDia(dia) {
    setDiaSelecionado(dia);
    setHorarioSelecionado(null);
  }

  function handleSelecionarHorario(horario) {
    setHorarioSelecionado(horario);
  }

  function handleAvancar() {
    if (!diaSelecionado || !horarioSelecionado) return;
    setEtapa("formulario");
  }

  async function handleAgendar(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);

    const resposta = await createAgendamento({
      nome: form.nome,
      celular: form.celular,
      motivo: form.motivo,
      data: formatarDataISO(diaSelecionado),
      horario: horarioSelecionado,
      terapeutaId: terapeuta.id,
    });

    if (resposta.message && !resposta.id) {
      setErro(resposta.message);
      setEnviando(false);
      return;
    }

    setEtapa("sucesso");
    setEnviando(false);
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const atual = SECOES.indexOf(secaoAtiva);
      if (atual < SECOES.length - 1) {
        setSecaoAtiva(SECOES[atual + 1]);
      }
    },
    onSwipedRight: () => {
      const atual = SECOES.indexOf(secaoAtiva);
      if (atual > 0) {
        setSecaoAtiva(SECOES[atual - 1]);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
  });

  if (loading) return <p className="td-loading">Carregando...</p>;
  if (!terapeuta)
    return <p className="td-loading">Terapeuta não encontrado.</p>;

  const diasDisponiveis = gerarProximosDias(terapeuta.diasDisponiveis);

  return (
    <div className="td-container">
      {/* Header */}
      <header className="td-header">
        <button className="td-voltar" onClick={() => navigate("/")}>
          ← Voltar
        </button>
      </header>

      <div className="td-layout">
        {/* Sidebar */}
        <aside className="td-sidebar">
          <img src={terapeuta.foto} alt={terapeuta.nome} className="td-foto" />
          <h1 className="td-nome">{terapeuta.nome}</h1>
          <p className="td-especialidade">{terapeuta.especialidade}</p>
          <p className="td-crp">CRP {terapeuta.crp}</p>

          <div className="td-avaliacao">
            <span className="td-estrelas">
              {renderEstrelas(terapeuta.avaliacao)}
            </span>
            <span className="td-avaliacao-num">{terapeuta.avaliacao}</span>
          </div>
          <p className="td-consultas">
            <span className="td-icon-text">
              <Calendar size={16} />
              <span>{terapeuta.consultas} Consultas Realizadas</span>
            </span>
          </p>

          <p className="td-cidade">
            <span className="td-icon-text">
              <MapPin size={16} />
              <span>
                {terapeuta.cidade} - {terapeuta.estado}
              </span>
            </span>
          </p>
          {/* Navegação sidebar */}
          <nav className="td-nav">
            {[
              {
                id: "agendar",
                label: "Agendar consulta",
                icone: <Calendar size={15} />,
              },
              { id: "sobre", label: "Sobre mim", icone: <User size={15} /> },
              {
                id: "localizacao",
                label: "Localização",
                icone: <MapPin size={15} />,
              },
              {
                id: "avaliacoes",
                label: "Avaliações",
                icone: <Star size={15} />,
              },
            ].map((item) => (
              <button
                key={item.id}
                className={`td-nav-item ${secaoAtiva === item.id ? "ativo" : ""}`}
                onClick={() => setSecaoAtiva(item.id)}
              >
                {item.icone} {item.label}
              </button>
            ))}
          </nav>
          <div className="td-dots">
            {SECOES.map((s) => (
              <span
                key={s}
                className={`td-dot ${secaoAtiva === s ? "ativo" : ""}`}
              />
            ))}
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="td-main" {...handlers}>
          {/* Agendar */}
          {secaoAtiva === "agendar" && (
            <section className="td-secao">
              <h2 className="td-secao-titulo">Agendar consulta</h2>

              {etapa === "calendario" && (
                <>
                  <p className="td-label">Escolha um dia</p>
                  <div className="td-dias">
                    {diasDisponiveis.map((dia, i) => (
                      <button
                        key={i}
                        className={`td-dia ${diaSelecionado && formatarDataISO(diaSelecionado) === formatarDataISO(dia) ? "selecionado" : ""}`}
                        onClick={() => {
                          setDiaSelecionado(dia);
                          setHorarioSelecionado(null);
                        }}
                      >
                        {formatarData(dia)}
                      </button>
                    ))}
                  </div>

                  {diaSelecionado && (
                    <>
                      <p className="td-label">Escolha um horário</p>
                      <div className="td-horarios">
                        {terapeuta.horarios.map((h) => {
                          const ocupado = horarioOcupado(diaSelecionado, h);
                          return (
                            <button
                              key={h}
                              className={`td-horario ${horarioSelecionado === h ? "selecionado" : ""} ${ocupado ? "ocupado" : ""}`}
                              onClick={() =>
                                !ocupado && setHorarioSelecionado(h)
                              }
                              disabled={ocupado}
                            >
                              {h}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {horarioSelecionado && (
                    <button
                      className="td-btn-primary"
                      onClick={() => setEtapa("formulario")}
                    >
                      Continuar →
                    </button>
                  )}
                </>
              )}

              {etapa === "formulario" && (
                <form className="td-form" onSubmit={handleAgendar}>
                  <p className="td-resumo">
                    <span className="td-icon-text">
                      <Calendar size={16} />
                      <span>
                        {formatarData(diaSelecionado)} às {horarioSelecionado}
                      </span>
                    </span>
                  </p>

                  <div className="td-campo">
                    <label>Nome completo</label>
                    <input
                      type="text"
                      placeholder="João da Silva"
                      value={form.nome}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, nome: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="td-campo">
                    <label>Celular (WhatsApp)</label>
                    <input
                      type="text"
                      placeholder="11999999999"
                      value={form.celular}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, celular: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="td-campo">
                    <label>Motivo da consulta</label>
                    <textarea
                      placeholder="Descreva brevemente..."
                      value={form.motivo}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, motivo: e.target.value }))
                      }
                      rows={3}
                      required
                    />
                  </div>

                  {erro && <p className="td-erro">{erro}</p>}

                  <div className="td-form-acoes">
                    <button
                      type="button"
                      className="td-btn-secondary"
                      onClick={() => setEtapa("calendario")}
                    >
                      ← Voltar
                    </button>
                    <button
                      type="submit"
                      className="td-btn-primary"
                      disabled={enviando}
                    >
                      {enviando ? "Agendando..." : "Confirmar"}
                    </button>
                  </div>
                </form>
              )}

              {etapa === "sucesso" && (
                <div className="td-sucesso">
                  <p className="td-sucesso-icone">✅</p>
                  <h3>Consulta agendada!</h3>
                  <p>
                    {formatarData(diaSelecionado)} às {horarioSelecionado}
                  </p>
                  {terapeuta.telefone && (
                    <a
                      className="td-btn-whatsapp"
                      href={`https://wa.me/55${terapeuta.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Olá ${terapeuta.nome}! Agendei uma consulta para ${formatarData(diaSelecionado)} às ${horarioSelecionado}. Meu nome é ${form.nome}.`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Phone /> Confirmar pelo WhatsApp
                    </a>
                  )}
                  {/* <button
                    className="td-btn-primary"
                    onClick={() => navigate("/")}
                  >
                    Voltar ao início
                  </button> */}
                </div>
              )}
            </section>
          )}

          {/* Sobre */}
          {secaoAtiva === "sobre" && (
            <section className="td-secao">
              <h2 className="td-secao-titulo">Sobre mim</h2>
              <p className="td-descricao">{terapeuta.descricao}</p>

              <div className="td-info-grid">
                <div className="td-info-item">
                  <span className="td-info-label">Especialidade</span>
                  <span className="td-info-valor">
                    {terapeuta.especialidade}
                  </span>
                </div>
                <div className="td-info-item">
                  <span className="td-info-label">CRP</span>
                  <span className="td-info-valor">{terapeuta.crp}</span>
                </div>
                <div className="td-info-item">
                  <span className="td-info-label">Consultas</span>
                  <span className="td-info-valor">{terapeuta.consultas}</span>
                </div>
                <div className="td-info-item">
                  <span className="td-info-label">Avaliação</span>
                  <span className="td-info-valor">
                    {terapeuta.avaliacao} / 5
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Localização */}
          {secaoAtiva === "localizacao" && (
            <section className="td-secao">
              <h2 className="td-secao-titulo">Localização</h2>
              {terapeuta.cidade ? (
                <div className="td-localizacao">
                  <p className="td-localizacao-texto">
                    <span className="td-icon-text">
                      <MapPin size={16} />
                      <span>
                        {terapeuta.cidade} - {terapeuta.estado}
                      </span>
                    </span>
                  </p>

                  <div className="td-mapa-placeholder">
                    <MapPin size={24} color="#888" />
                    <p>Mapa em breve</p>
                  </div>

                  <a
                    className="td-mapa-link"
                    href={`https://www.google.com/maps/search/${terapeuta.cidade},${terapeuta.estado},Brasil`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver no Google Maps
                  </a>
                </div>
              ) : (
                <p className="td-vazio">Localização não informada.</p>
              )}
            </section>
          )}

          {/* Avaliações */}
          {/* {secaoAtiva === "avaliacoes" && (
            <section className="td-secao">
              <h2 className="td-secao-titulo">Avaliações</h2>

              <div className="td-avaliacao-resumo">
                <span className="td-avaliacao-num-grande">
                  {terapeuta.avaliacao}
                </span>
                <div>
                  <p className="td-estrelas-grandes">
                    {renderEstrelas(terapeuta.avaliacao)}
                  </p>
                  <p className="td-total-avaliacoes">
                    {terapeuta.consultas} avaliações
                  </p>
                </div>
              </div>

              <div className="td-depoimentos">
                {DEPOIMENTOS.map((d, i) => (
                  <div key={i} className="td-depoimento">
                    <div className="td-depoimento-topo">
                      <span className="td-depoimento-nome">{d.nome}</span>
                      <span className="td-depoimento-estrelas">
                        {"★".repeat(d.nota)}
                      </span>
                    </div>
                    <p className="td-depoimento-texto">{d.texto}</p>
                  </div>
                ))}
              </div>
            </section>
          )} */}
        </main>
      </div>
    </div>
  );
}

export default TerapeutaDetalhe;
