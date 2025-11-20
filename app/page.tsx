import { DashboardStats } from "@/components/dashboard/stats";
import { IdeiasLista } from "@/components/dashboard/ideias-lista";
import { WorkflowsLog } from "@/components/dashboard/workflows-log";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
            PULSO Control
          </h1>
        </div>
        <p className="text-zinc-400">
          Dashboard de controle total do ecossistema de conteúdo
        </p>
      </header>

      {/* Stats Cards */}
      <section className="mb-8">
        <DashboardStats />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IdeiasLista />
        <WorkflowsLog />
      </div>
    </main>
  );
}
