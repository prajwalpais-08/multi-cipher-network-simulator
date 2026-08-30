const startSimulation = async () => {
  setLoading(true);
  setError("");
  setResult(null);

  try {
    const response = await fetch(
      "https://multi-cipher-network-simulator.onrender.com/api/simulate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: message,
          algorithm: algorithm,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Simulation failed"
      );
    }

    setResult(data);

  } catch (err) {
    console.error(err);

    setError(
      err.message ||
      "Failed to connect to backend"
    );

  } finally {
    setLoading(false);
  }
};
