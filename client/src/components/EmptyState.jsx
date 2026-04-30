import { ClipboardList } from "lucide-react";

export default function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <ClipboardList size={34} />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
