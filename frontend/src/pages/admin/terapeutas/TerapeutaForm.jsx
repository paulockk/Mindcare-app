import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTerapeutaById,
  createTerapeuta,
  updateTerapeuta,
  getEstados,
  getCidadesPorEstado,
} from "../../../services/api";
import "./TerapeutaForm.css";

const DIAS = [
  { valor: "monday", label: "Segunda" },
  { valor: "tuesday", label: "Terça" },
  { valor: "wednesday", label: "Quarta" },
  { valor: "thursday", label: "Quinta" },
  { valor: "friday", label: "Sexta" },
  { valor: "saturday", label: "Sábado" },
];

const HORARIOS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const FORM_INICIAL = {
  nome: "",
  especialidade: "",
  crp: "",
  descricao: "",
  foto: "",
  telefone: "",
  avaliacao: "",
  consultas: "",
  disponivel: true,
  estado: "",
  cidade: "",
  diasDisponiveis: [],
  horarios: [],
};

function TerapeutaForm() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const isEdicao = !!id;

  // Carrega estados do IBGE
  useEffect(() => {
    async function carregarEstados() {
      const dados = await getEstados();
      setEstados(dados);
    }
    carregarEstados();
  }, []);

  // Se for edição, carrega os dados do terapeuta
  useEffect(() => {
    if (!isEdicao) return;

    async function carregarTerapeuta() {
      const dados = await getTerapeutaById(id);
      setForm(dados);

      // Carrega cidades do estado já salvo
      if (dados.estado) {
        const cidades = await getCidadesPorEstado(dados.estado);
        setCidades(cidades);
      }
    }
    carregarTerapeuta();
  }, [id, isEdicao]);

  // Carrega cidades quando estado muda
  useEffect(() => {
    if (!form.estado) return;

    async function carregarCidades() {
      const dados = await getCidadesPorEstado(form.estado);
      setCidades(dados);
    }
    carregarCidades();
  }, [form.estado]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleCheckboxLista(campo, valor) {
    setForm((prev) => {
      const lista = prev[campo];
      const jaTemn = lista.includes(valor);
      return {
        ...prev,
        [campo]: jaTemn
          ? lista.filter((item) => item !== valor)
          : [...lista, valor],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const dados = {
      ...form,
      avaliacao: Number(form.avaliacao),
      consultas: Number(form.consultas),
    };

    const resposta = isEdicao
      ? await updateTerapeuta(id, dados, token)
      : await createTerapeuta(dados, token);

    if (resposta.message && !resposta.id) {
      setErro(resposta.message);
      setLoading(false);
      return;
    }

    navigate("/admin");
  }

  return (
    <div className="form-container">
      <header className="form-header">
        <button className="btn-voltar" onClick={() => navigate("/admin")}>
          ← Voltar
        </button>
        <h1>{isEdicao ? "Editar Terapeuta" : "Novo Terapeuta"}</h1>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        {/* Dados básicos */}
        <section className="form-secao">
          <h2 className="form-secao-titulo">Dados básicos</h2>

          <div className="form-campo">
            <label>Nome completo</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Ex: Maria Silva Santos"
              required
            />
          </div>

          <div className="form-campo">
            <label>Especialidade</label>
            <input
              type="text"
              name="especialidade"
              value={form.especialidade}
              onChange={handleChange}
              placeholder="Ex: Psicologia Clínica, Terapia Cognitivo-Comportamental"
              required
            />
          </div>

          <div className="form-campo">
            <label>CRP</label>
            <input
              type="text"
              name="crp"
              value={form.crp}
              onChange={handleChange}
              placeholder="Ex: CRP 11/12345"
              required
            />
          </div>

          <div className="form-campo">
            <label>Descrição</label>
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Ex: Psicóloga com 10 anos de experiência em ansiedade e depressão"
              rows={4}
              required
            />
          </div>

          <div className="form-campo">
            <label>URL da foto</label>
            <input
              type="text"
              name="foto"
              value={form.foto}
              onChange={handleChange}
              placeholder="Ex: https://site.com/foto.jpg"
            />
          </div>

          <div className="form-campo">
            <label>Telefone (WhatsApp)</label>
            <input
              type="text"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="11999999999"
            />
          </div>

          <div className="form-linha">
            <div className="form-campo">
              <label>Avaliação</label>
              <input
                type="number"
                name="avaliacao"
                value={form.avaliacao}
                onChange={handleChange}
                min="0"
                max="5"
                step="0.1"
                placeholder="Ex: 4.5"
              />
            </div>

            <div className="form-campo">
              <label>Consultas realizadas</label>
              <input
                type="number"
                name="consultas"
                value={form.consultas}
                onChange={handleChange}
                min="0"
                placeholder="Ex: 150"
              />
            </div>
          </div>

          <label className="form-check">
            <input
              type="checkbox"
              name="disponivel"
              checked={form.disponivel}
              onChange={handleChange}
            />
            Disponível para agendamentos
          </label>
        </section>

        {/* Localização */}
        <section className="form-secao">
          <h2 className="form-secao-titulo">Localização</h2>

          <div className="form-campo">
            <label>Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o estado</option>
              {estados.map((e) => (
                <option key={e.id} value={e.sigla}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-campo">
            <label>Cidade</label>
            <select
              name="cidade"
              value={form.cidade}
              onChange={handleChange}
              disabled={!form.estado}
              required
            >
              <option value="">
                {form.estado
                  ? "Selecione a cidade"
                  : "Selecione o estado primeiro"}
              </option>
              {cidades.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Dias disponíveis */}
        <section className="form-secao">
          <h2 className="form-secao-titulo">Dias disponíveis</h2>
          <div className="form-checkboxes">
            {DIAS.map((dia) => (
              <label key={dia.valor} className="form-check">
                <input
                  type="checkbox"
                  checked={form.diasDisponiveis.includes(dia.valor)}
                  onChange={() =>
                    handleCheckboxLista("diasDisponiveis", dia.valor)
                  }
                />
                {dia.label}
              </label>
            ))}
          </div>
        </section>

        {/* Horários */}
        <section className="form-secao">
          <h2 className="form-secao-titulo">Horários disponíveis</h2>
          <div className="form-checkboxes">
            {HORARIOS.map((horario) => (
              <label key={horario} className="form-check">
                <input
                  type="checkbox"
                  checked={form.horarios.includes(horario)}
                  onChange={() => handleCheckboxLista("horarios", horario)}
                />
                {horario}
              </label>
            ))}
          </div>
        </section>

        {erro && <p className="form-erro">{erro}</p>}

        <button type="submit" className="btn-salvar" disabled={loading}>
          {loading
            ? "Salvando..."
            : isEdicao
              ? "Salvar alterações"
              : "Cadastrar terapeuta"}
        </button>
      </form>
    </div>
  );
}

export default TerapeutaForm;
