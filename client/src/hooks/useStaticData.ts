import { useEffect, useState } from "react";
import { loadStaticData, StaticDataBundle } from "@/lib/staticData";

interface StaticDataState {
  loading: boolean;
  error?: string;
  data?: StaticDataBundle;
}

export function useStaticData() {
  const [state, setState] = useState<StaticDataState>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    loadStaticData()
      .then(data => {
        if (!cancelled) setState({ loading: false, data });
      })
      .catch(err => {
        if (!cancelled) setState({ loading: false, error: err.message || "Failed to load data" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
