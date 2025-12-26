import { create } from "zustand";

interface IBreadcrumb {
  name: string;
  path: string | null;
}

interface BreadcrumbState {
  data: IBreadcrumb[];
  set: (data: IBreadcrumb[]) => void;
}

export const useBreadcrumStore = create<BreadcrumbState>((set) => ({
  data: [],
  set: (data: IBreadcrumb[]) => set({ data }),
}));
