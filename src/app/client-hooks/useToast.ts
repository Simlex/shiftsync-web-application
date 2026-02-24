import { useUI } from "@/contexts/ui-context";
import { ToastType } from "@/types";

export const useToast = () => {
  const { addToast, removeToast } = useUI();

  const toast = (
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    addToast({ type, title, message, duration });
  };

  return {
    success: (title: string, message?: string) =>
      toast("success", title, message),
    error: (title: string, message?: string) =>
      toast("error", title, message),
    info: (title: string, message?: string) =>
      toast("info", title, message),
    warning: (title: string, message?: string) =>
      toast("warning", title, message),
    remove: removeToast,
  };
};
