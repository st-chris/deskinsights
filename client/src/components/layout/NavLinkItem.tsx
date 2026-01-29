import { NavLink } from "react-router-dom";

export default function NavLinkItem({ label, to }: { label: string; to: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-1 py-0.5 transition ${
          isActive
            ? "text-amber-700 border-b-2 border-amber-500"
            : "text-slate-600 hover:text-slate-900"
        }`
      }
    >
      {label}
    </NavLink>
  );
}