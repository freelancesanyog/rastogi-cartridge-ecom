import Swal from "sweetalert2";

export function showTopAlert(
  message: string,
  icon: "warning" | "error" | "info" | "success" = "warning"
) {
  Swal.fire({
    toast: true,
    position: "top",
    icon,
    title: message,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    customClass: {
      popup: "font-sans text-xs font-semibold rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white",
    },
  });
}
