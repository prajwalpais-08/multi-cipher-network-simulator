import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

function App() {
  const [message, setMessage] = useState(
    "Hello, this is my secret PBL project message!"
  );

  const [algorithm, setAlgorithm] = useState("Fernet");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Stores previous simulations for graphs and table
  const [simulationHistory, setSimulationHistory] = useState([]);

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
        throw new Error(data.message || "Simulation failed");
      }

      setResult(data);

      // Add simulation to history
      const historyItem = {
        id: Date.now(),
        algorithm: data.algorithm,
        encryptionTime: Number(data.metrics?.encryptionTimeMs || 0),
        decryptionTime: Number(data.metrics?.decryptionTimeMs || 0),
        plaintextLength: Number(data.metrics?.plaintextLength || 0),
        ciphertextLength: Number(data.metrics?.ciphertextLength || 0),
      };

      setSimulationHistory((previous) => [
        ...previous,
        historyItem,
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to connect to backend"
      );
    } finally {
      setLoading(false);
    }
  };

  // Latest 10 simulations for charts
  const chartHistory = simulationHistory.slice(-10);

  const timeChartData = chartHistory.map((item, index) => ({
    name: `${item.algorithm} ${index + 1}`,
    Encryption: item.encryptionTime,
    Decryption: item.decryptionTime,
  }));

  const sizeChartData = chartHistory.map((item, index) => ({
    name: `${item.algorithm} ${index + 1}`,
    Plaintext: item.plaintextLength,
    "Ciphertext / Hash": item.ciphertextLength,
  }));

  const totalEncryptionTime = simulationHistory.reduce(
    (total, item) => total + item.encryptionTime,
    0
  );

  const totalDecryptionTime = simulationHistory.reduce(
    (total, item) => total + item.decryptionTime,
    0
  );

  const averageEncryptionTime =
    simulationHistory.length > 0
      ? totalEncryptionTime / simulationHistory.length
      : 0;

  const averageDecryptionTime =
    simulationHistory.length > 0
      ? totalDecryptionTime / simulationHistory.length
      : 0;

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <h1>
          Interactive Multi-Cipher Network Simulator
        </h1>

        <p>
          Cryptography & Network Attack Simulation Framework
        </p>
      </header>

      <main className="main-container">

        {/* INPUT SECTION */}
        <section className="input-section">

          <h2>
            Secure Message Simulation
          </h2>

          <p>
            Enter a confidential message and select an
            encryption algorithm to observe secure
            communication from Device A to Device B while
            Device C intercepts the encrypted traffic.
          </p>

          <div className="algorithm-selector">

            <label>
              Select Encryption Algorithm
            </label>

            <select
              value={algorithm}
              onChange={(event) =>
                setAlgorithm(event.target.value)
              }
            >
              <option value="Fernet">
                Fernet (Symmetric Encryption)
              </option>

              <option value="AES">
                AES-256 (Symmetric Encryption)
              </option>

              <option value="RSA">
                RSA-2048 (Asymmetric Encryption)
              </option>

              <option value="SHA-256">
                SHA-256 (Cryptographic Hash)
              </option>
            </select>

          </div>

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Enter your confidential message..."
          />

          <button
            className="simulate-button"
            onClick={startSimulation}
            disabled={loading}
          >
            {loading
              ? "Running Simulation..."
              : "Start Secure Simulation"}
          </button>

        </section>

        {/* ACTIVE ALGORITHM */}
        <div className="algorithm-badge">
          Active Cipher: {algorithm}
        </div>

        {/* NETWORK TOPOLOGY */}
        <section className="network-section">

          <h2>
            Network Topology
          </h2>

          <p className="topology-description">
            Sender → Interceptor → Receiver
          </p>

          <div className="network-container">

            {/* DEVICE A */}
            <div className="device-card sender">

              <div className="device-icon">
                💻
              </div>

              <p className="device-label">
                DEVICE A
              </p>

              <h2>
                Sender
              </h2>

              <p className="device-description">
                Encrypts the original message.
              </p>

              <div className="device-output">

                {result ? (
                  <>
                    <strong>
                      {result.algorithm === "SHA-256"
                        ? "HASH GENERATED"
                        : "ENCRYPTION SUCCESSFUL"}
                    </strong>

                    <br />
                    <br />

                    <strong>
                      Plaintext:
                    </strong>

                    <br />

                    {result.deviceA?.plaintext}

                    <br />
                    <br />

                    <strong>
                      Algorithm:
                    </strong>

                    <br />

                    {result.algorithm}

                    <br />
                    <br />

                    <strong>
                      Status:
                    </strong>

                    <br />

                    {result.deviceA?.status}
                  </>
                ) : (
                  <>
                    PLAINTEXT

                    <br />
                    <br />

                    {message}

                    <br />
                    <br />

                    Waiting for simulation...
                  </>
                )}

              </div>
            </div>

            {/* ARROW 1 */}
            <div className="arrow-container">

              <div className="arrow">
                →
              </div>

              <p>
                {algorithm === "SHA-256"
                  ? "Hash"
                  : "Encrypted"}
                <br />
                Traffic
              </p>

            </div>

            {/* DEVICE C */}
            <div className="device-card attacker">

              <div className="device-icon">
                ⚠️
              </div>

              <p className="device-label">
                DEVICE C
              </p>

              <h2>
                Interceptor
              </h2>

              <p className="device-description">
                Attempts to capture network traffic.
              </p>

              <div className="device-output">

                {result ? (
                  <>
                    <strong>
                      ⚠ ATTACKER INTERCEPTION
                    </strong>

                    <br />
                    <br />

                    <strong>
                      {result.algorithm === "SHA-256"
                        ? "Captured Hash:"
                        : "Captured Ciphertext:"}
                    </strong>

                    <br />
                    <br />

                    <span className="ciphertext">
                      {result.deviceC?.interceptedData}
                    </span>

                    <br />
                    <br />

                    <strong>
                      Status:
                    </strong>

                    <br />

                    {result.deviceC?.status}
                  </>
                ) : (
                  <>
                    Monitoring network
                    <br />
                    traffic...
                  </>
                )}

              </div>
            </div>

            {/* ARROW 2 */}
            <div className="arrow-container">

              <div className="arrow">
                →
              </div>

              <p>
                Forwarded
                <br />
                Traffic
              </p>

            </div>

            {/* DEVICE B */}
            <div className="device-card receiver">

              <div className="device-icon">
                🔐
              </div>

              <p className="device-label">
                DEVICE B
              </p>

              <h2>
                Receiver
              </h2>

              <p className="device-description">
                Decrypts and recovers the message.
              </p>

              <div className="device-output">

                {result ? (
                  <>
                    <strong>
                      {result.algorithm === "SHA-256"
                        ? "HASH RESULT"
                        : "DECRYPTION SUCCESSFUL"}
                    </strong>

                    <br />
                    <br />

                    <strong>
                      {result.algorithm === "SHA-256"
                        ? "Result:"
                        : "Recovered Message:"}
                    </strong>

                    <br />
                    <br />

                    {result.deviceB?.decryptedMessage}

                    <br />
                    <br />

                    <strong>
                      Status:
                    </strong>

                    <br />

                    {result.deviceB?.status}
                  </>
                ) : (
                  <>
                    Waiting for
                    <br />
                    transmission...
                  </>
                )}

              </div>
            </div>

          </div>
        </section>

        {/* SIMULATION STATUS */}
        <section className="status-section">

          <h2>
            Simulation Status
          </h2>

          {loading && (
            <div className="status-box">
              <p>● RUNNING</p>
              Processing secure communication...
            </div>
          )}

          {!loading && !result && !error && (
            <div className="status-box">
              <p>● READY</p>
              Select an algorithm and start the simulation.
            </div>
          )}

          {result && (
            <div className="status-box success-status">
              <p>● SUCCESS</p>

              {result.algorithm === "SHA-256"
                ? "SHA-256 hash generated successfully."
                : `${result.algorithm} encryption and decryption completed successfully.`}
            </div>
          )}

          {error && (
            <div className="status-box error-status">
              <p>● ERROR</p>
              {error}
            </div>
          )}

        </section>

        {/* CURRENT METRICS */}
        {result && result.metrics && (
          <section className="metrics-container">

            <div className="metric-card">
              <h4>Algorithm</h4>
              <p>{result.algorithm}</p>
            </div>

            <div className="metric-card">
              <h4>Encryption / Hash Time</h4>
              <p>
                {result.metrics.encryptionTimeMs} ms
              </p>
            </div>

            <div className="metric-card">
              <h4>Decryption / Processing Time</h4>
              <p>
                {result.metrics.decryptionTimeMs} ms
              </p>
            </div>

            <div className="metric-card">
              <h4>Plaintext Size</h4>
              <p>
                {result.metrics.plaintextLength} bytes
              </p>
            </div>

            <div className="metric-card">
              <h4>Ciphertext / Hash Size</h4>
              <p>
                {result.metrics.ciphertextLength} bytes
              </p>
            </div>

          </section>
        )}

        {/* PERFORMANCE ANALYTICS */}
        {simulationHistory.length > 0 && (
          <section className="analytics-section">

            <div className="analytics-header">
              <div>
                <h2>
                  Performance Analytics
                </h2>

                <p>
                  Comparison of encryption performance,
                  processing time and data size across simulations.
                </p>
              </div>

              <div className="simulation-count">
                {simulationHistory.length} Simulation
                {simulationHistory.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="analytics-summary">

              <div className="summary-card">
                <span>
                  Simulations
                </span>

                <strong>
                  {simulationHistory.length}
                </strong>
              </div>

              <div className="summary-card">
                <span>
                  Avg. Encryption Time
                </span>

                <strong>
                  {averageEncryptionTime.toFixed(4)} ms
                </strong>
              </div>

              <div className="summary-card">
                <span>
                  Avg. Decryption Time
                </span>

                <strong>
                  {averageDecryptionTime.toFixed(4)} ms
                </strong>
              </div>

              <div className="summary-card">
                <span>
                  Current Algorithm
                </span>

                <strong>
                  {algorithm}
                </strong>
              </div>

            </div>

            {/* CHARTS */}
            <div className="charts-grid">

              {/* TIME CHART */}
              <div className="chart-card">

                <div className="chart-title">
                  <h3>
                    Encryption vs Decryption Time
                  </h3>

                  <p>
                    Processing time in milliseconds
                  </p>
                </div>

                <div className="chart-wrapper">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={timeChartData}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 0,
                        bottom: 50,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis
                        dataKey="name"
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                      />

                      <YAxis
                        label={{
                          value: "Time (ms)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />

                      <Tooltip />

                      <Legend />

                      <Bar
                        dataKey="Encryption"
                        fill="#7c3aed"
                        radius={[5, 5, 0, 0]}
                      />

                      <Bar
                        dataKey="Decryption"
                        fill="#10b981"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                </div>
              </div>

              {/* SIZE CHART */}
              <div className="chart-card">

                <div className="chart-title">
                  <h3>
                    Message Size Comparison
                  </h3>

                  <p>
                    Plaintext and encrypted/hash data size
                  </p>
                </div>

                <div className="chart-wrapper">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={sizeChartData}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 0,
                        bottom: 50,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis
                        dataKey="name"
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                      />

                      <YAxis
                        label={{
                          value: "Size (bytes)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />

                      <Tooltip />

                      <Legend />

                      <Bar
                        dataKey="Plaintext"
                        fill="#3b82f6"
                        radius={[5, 5, 0, 0]}
                      />

                      <Bar
                        dataKey="Ciphertext / Hash"
                        fill="#ef4444"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                </div>
              </div>

            </div>

            {/* DETAILED METRICS TABLE */}
            <div className="metrics-table-section">

              <div className="chart-title">
                <h3>
                  Detailed Performance Metrics
                </h3>

                <p>
                  Complete record of all executed simulations
                </p>
              </div>

              <div className="table-wrapper">

                <table className="metrics-table">

                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Algorithm</th>
                      <th>Encryption / Hash</th>
                      <th>Decryption / Processing</th>
                      <th>Plaintext</th>
                      <th>Ciphertext / Hash</th>
                      <th>Total Time</th>
                    </tr>
                  </thead>

                  <tbody>

                    {simulationHistory.map((item, index) => {

                      const totalTime =
                        item.encryptionTime +
                        item.decryptionTime;

                      return (
                        <tr key={item.id}>

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            <span className="algorithm-tag">
                              {item.algorithm}
                            </span>
                          </td>

                          <td>
                            {item.encryptionTime.toFixed(4)} ms
                          </td>

                          <td>
                            {item.decryptionTime.toFixed(4)} ms
                          </td>

                          <td>
                            {item.plaintextLength} bytes
                          </td>

                          <td>
                            {item.ciphertextLength} bytes
                          </td>

                          <td className="total-time">
                            {totalTime.toFixed(4)} ms
                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>

            </div>

          </section>
        )}

      </main>

      <footer className="footer">
        PBL Project • Cryptography & Network Security
      </footer>

    </div>
  );
}

export default App;
