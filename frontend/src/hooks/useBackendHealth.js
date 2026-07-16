import { useEffect, useState } from "react";

import { getHealth } from "../services/api.js";

export function useBackendHealth() {
  const [state, setState] = useState({
    status: "loading",
    message: "Checking API",
  });

  useEffect(() => {
    let active = true;

    getHealth()
      .then((data) => {
        if (active) {
          setState({ status: "connected", message: data.status });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: "error", message: "API unavailable" });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
