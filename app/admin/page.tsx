import { Shield, CheckCircle2, Users, FileText } from "lucide-react";
import { requireStaffRole } from "../../lib/auth/page-guard";

export default async function AdminPage() {
  const { user, role } = await requireStaffRole(["owner", "admin"]);

  return (
    <div className="space-y-8">
      {/* Welcome architectural banner */}
      <div className="relative overflow-hidden border border-white/10 bg-[#080a0c] p-6 sm:p-8">
        <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#00e599] animate-pulse" />
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#00e599] uppercase">
                AUTHENTICATED SESSION ACTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {user.email?.split("@")[0] || "Staff Member"}
            </h1>
            <p className="arabic text-sm text-white/50 mt-1 font-medium">
              أهلاً بك في نظام إدارة ومراجعة طلبات التقديم لنادي IT Club.
            </p>
          </div>

          <div className="flex items-center gap-2 border border-white/10 bg-white/[0.02] px-4 py-2.5">
            <Shield size={16} className="text-[#00e599]" />
            <div className="text-right sm:text-left">
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/40">Role Authority</p>
              <p className="font-mono text-xs font-bold text-white uppercase">{role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Foundation Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-white/10 bg-[#080a0c] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/40">FOUNDATION</span>
            <CheckCircle2 size={16} className="text-[#00e599]" />
          </div>
          <h2 className="text-base font-bold text-white mb-1">Staff Auth Secured</h2>
          <p className="text-xs text-white/50 leading-relaxed">
            Database-backed role verification established. Ordinary users and anonymous visitors cannot access administrative routes.
          </p>
        </div>

        <div className="border border-white/10 bg-[#080a0c] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/40">ROLE MODEL</span>
            <Users size={16} className="text-[#18c8ed]" />
          </div>
          <h2 className="text-base font-bold text-white mb-1">Owner & Admin Tier</h2>
          <p className="text-xs text-white/50 leading-relaxed">
            Least-privilege RLS constraints enforced on <code className="text-white/70">public.staff_members</code>. Safe one-time Owner bootstrap active.
          </p>
        </div>

        <div className="border border-white/10 bg-[#080a0c] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/40">DATA INTEGRITY</span>
            <FileText size={16} className="text-[#9b7cff]" />
          </div>
          <h2 className="text-base font-bold text-white mb-1">Applications Preserved</h2>
          <p className="text-xs text-white/50 leading-relaxed">
            All submitted recruitment records remain intact with server-controlled <code className="text-white/70">PENDING_REVIEW</code> status.
          </p>
        </div>
      </div>

      {/* Roadmap notification */}
      <div className="border border-white/5 bg-white/[0.01] p-6 text-center text-xs text-white/40 font-mono">
        <p>PHASE 1 COMPLETE · PHASE 2 WILL EXPAND APPLICATION FILTERING & EVALUATION ACTIONS</p>
      </div>
    </div>
  );
}
