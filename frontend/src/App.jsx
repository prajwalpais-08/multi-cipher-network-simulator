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

  // DES user-entered key
  const [desKey, setDesKey] = useState("12345678");

  // Caesar user-entered shift
  const [caesarShift, setCaesarShift] = useState(3);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Stores completed simulations
  const [simulationHistory, setSimulationHistory] = useState([]);

  // =====================================================
  // ALGORITHM CHANGE
  // =====================================================

  const handleAlgorithmChange = (event) => {
    setAlgorithm(event.target.value);
    setResult(null);
    setError("");
  };

  // =====================================================
  // START SIMULATION
  // =====================================================

  const startSimulation = async () => {
    if (!message.trim()) {
      setError("Please enter a message before starting the simulation.");
      return;
    }

    if (algorithm === "DES" && desKey.length !== 8) {
      setError("DES key must be exactly 8 characters long.");
      return;
    }

    if (algorithm === "Caesar") {
      const shift = Number(caesarShift);

      if (!Number.isInteger(shift)) {
        setError("Caesar shift must be a valid integer.");
        return;
      }
    }

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
      desKey: desKey,
      caesarShift: Number(caesarShift),
    }),
  }
);

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Backend returned an invalid response. Make sure Flask is running."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Simulation failed.");
      }

      setResult(data);

      // =================================================
      // SAVE METRICS TO HISTORY
      // =================================================

      const metrics = data.metrics || {};

      const encryptionTime = Number(
        metrics.encryptionTimeMs || 0
      );

      const decryptionTime = Number(
        metrics.decryptionTimeMs || 0
      );

      const plaintextSize = Number(
        metrics.plaintextLength || 0
      );

      const ciphertextSize = Number(
        metrics.ciphertextLength || 0
      );

      const totalTime =
        encryptionTime + decryptionTime;

      const sizeOverhead =
        plaintextSize > 0
          ? (
              ((ciphertextSize - plaintextSize) /
                plaintextSize) *
              100
            ).toFixed(2)
          : 0;

      const throughput =
        totalTime > 0
          ? (
              plaintextSize /
              (totalTime / 1000)
            ).toFixed(2)
          : 0;

      const historyEntry = {
        id: Date.now(),
        algorithm: data.algorithm || algorithm,
        encryptionTime,
        decryptionTime,
        plaintextSize,
        ciphertextSize,
        totalTime,
        sizeOverhead: Number(sizeOverhead),
        throughput: Number(throughput),
      };

      setSimulationHistory((previous) => [
        ...previous,
        historyEntry,
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to connect to backend. Make sure Flask is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CURRENT METRICS
  // =====================================================

  const currentMetrics = result?.metrics
    ? {
        encryptionTime: Number(
          result.metrics.encryptionTimeMs || 0
        ),

        decryptionTime: Number(
          result.metrics.decryptionTimeMs || 0
        ),

        plaintextSize: Number(
          result.metrics.plaintextLength || 0
        ),

        ciphertextSize: Number(
          result.metrics.ciphertextLength || 0
        ),
      }
    : null;

  const totalProcessingTime = currentMetrics
    ? (
        currentMetrics.encryptionTime +
        currentMetrics.decryptionTime
      ).toFixed(3)
    : "0.000";

  const currentOverhead =
    currentMetrics &&
    currentMetrics.plaintextSize > 0
      ? (
          ((currentMetrics.ciphertextSize -
            currentMetrics.plaintextSize) /
            currentMetrics.plaintextSize) *
          100
        ).toFixed(2)
      : "0.00";

  const currentThroughput =
    currentMetrics &&
    Number(totalProcessingTime) > 0
      ? (
          currentMetrics.plaintextSize /
          (Number(totalProcessingTime) / 1000)
        ).toFixed(2)
      : "0.00";

  // =====================================================
  // CHART DATA
  // =====================================================

  const timeChartData = simulationHistory.map(
    (item) => ({
      algorithm: item.algorithm,
      encryption: item.encryptionTime,
      decryption: item.decryptionTime,
    })
  );

  const sizeChartData = simulationHistory.map(
    (item) => ({
      algorithm: item.algorithm,
      plaintext: item.plaintextSize,
      ciphertext: item.ciphertextSize,
    })
  );

  // =====================================================
  // HELPER VALUES
  // =====================================================

  const isHash = algorithm === "SHA-256" || algorithm === "SHA3-256";

  const isDES = algorithm === "DES";

  const isCaesar = algorithm === "Caesar";

  const isElGamal = algorithm === "ElGamal";

  const getAlgorithmDescription = () => {
    switch (algorithm) {
      case "Fernet":
        return "Symmetric authenticated encryption";

      case "AES":
        return "AES-256 symmetric encryption";

      case "DES":
        return "DES symmetric encryption with user-provided key";

      case "RSA":
        return "RSA-2048 asymmetric encryption";

      case "ElGamal":
        return "Educational ElGamal asymmetric encryption";

      case "Caesar":
        return "Classical substitution cipher";

      case "SHA-256":
        return "One-way cryptographic hash function";

      case "SHA3-256":
        return "SHA3-256 one-way cryptographic hash function";

      default:
        return "Cryptographic algorithm";
    }
  };

  return (
    <div className="app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">
        <h1>
          Interactive Multi-Cipher Network Simulator
        </h1>

        <p>
          Cryptography & Network Attack Simulation Framework
        </p>
      </header>

      <main className="main-container">

        {/* =================================================
            INPUT SECTION
        ================================================= */}

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

          {/* ALGORITHM SELECTOR */}

          <div className="algorithm-selector">

            <label htmlFor="algorithm">
              Select Encryption Algorithm
            </label>

            <select
              id="algorithm"
              value={algorithm}
              onChange={handleAlgorithmChange}
            >
              <option value="Fernet">
                Fernet (Symmetric Encryption)
              </option>

              <option value="AES">
                AES-256 (Symmetric Encryption)
              </option>

              <option value="DES">
                DES (User Key)
              </option>

              <option value="RSA">
                RSA-2048 (Asymmetric Encryption)
              </option>

              <option value="ElGamal">
                ElGamal (Asymmetric Encryption)
              </option>

              <option value="Caesar">
                Caesar Cipher (Classical Cipher)
              </option>

              <option value="SHA-256">
                SHA-256 (Cryptographic Hash)
              </option>

              <option value="SHA3-256">
                SHA3-256 (Cryptographic Hash)
              </option>
            </select>

          </div>

          {/* =================================================
              DES KEY INPUT
          ================================================= */}

          {isDES && (
            <div className="algorithm-parameter">

              <label htmlFor="des-key">
                DES Key
              </label>

              <input
                id="des-key"
                type="text"
                value={desKey}
                maxLength={8}
                onChange={(event) =>
                  setDesKey(event.target.value)
                }
                placeholder="Enter exactly 8 characters"
              />

              <small>
                DES requires exactly 8 characters.
                Current length: {desKey.length}/8
              </small>

            </div>
          )}

          {/* =================================================
              CAESAR SHIFT INPUT
          ================================================= */}

          {isCaesar && (
            <div className="algorithm-parameter">

              <label htmlFor="caesar-shift">
                Caesar Shift
              </label>

              <input
                id="caesar-shift"
                type="number"
                value={caesarShift}
                onChange={(event) =>
                  setCaesarShift(event.target.value)
                }
                placeholder="Enter shift value"
              />

              <small>
                Example: 3 changes A → D, B → E, C → F.
              </small>

            </div>
          )}

          {/* =================================================
              ELGAMAL INFORMATION
          ================================================= */}

          {isElGamal && (
            <div className="algorithm-parameter">

              <label>
                ElGamal Configuration
              </label>

              <div className="parameter-info">
                Educational ElGamal implementation
                using a generated key pair.
              </div>

            </div>
          )}

          {/* =================================================
              SHA INFORMATION
          ================================================= */}

          {isHash && (
            <div className="algorithm-parameter">

              <label>
                {algorithm} Information
              </label>

              <div className="parameter-info">
                {algorithm} is a one-way hash function.
                It does not perform decryption.
              </div>

            </div>
          )}

          {/* MESSAGE */}

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Enter your confidential message..."
            rows={6}
          />

          {/* BUTTON */}

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

        {/* =================================================
            ACTIVE ALGORITHM
        ================================================= */}

        <div className="algorithm-badge">
          <strong>Active Cipher:</strong> {algorithm}

          <span>
            {getAlgorithmDescription()}
          </span>
        </div>

        {/* =================================================
            NETWORK TOPOLOGY
        ================================================= */}

        <section className="network-section">

          <h2>
            Network Topology
          </h2>

          <p className="topology-description">
            Sender → Interceptor → Receiver
          </p>

          <div className="network-container">

            {/* =================================================
                DEVICE A
            ================================================= */}

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
                      {isHash
                        ? "HASH GENERATED"
                        : "ENCRYPTION SUCCESSFUL"}
                    </strong>

                    <br />
                    <br />

                    <strong>
                      Plaintext:
                    </strong>

                    <br />

                    {result.deviceA?.plaintext || message}

                    <br />
                    <br />

                    <strong>
                      Algorithm:
                    </strong>

                    <br />

                    {result.algorithm}

                    <br />
                    <br />

                    {isDES && (
                      <>
                        <strong>
                          DES Key:
                        </strong>

                        <br />

                        {desKey}

                        <br />
                        <br />
                      </>
                    )}

                    {isCaesar && (
                      <>
                        <strong>
                          Shift:
                        </strong>

                        <br />

                        {caesarShift}

                        <br />
                        <br />
                      </>
                    )}

                    <strong>
                      Status:
                    </strong>

                    <br />

                    {result.deviceA?.status ||
                      "Message processed successfully."}
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

            {/* =================================================
                ARROW
            ================================================= */}

            <div className="arrow-container">

              <div className="arrow">
                →
              </div>

              <p>
                {isHash
                  ? "Hash"
                  : "Encrypted"}
                <br />
                Traffic
              </p>

            </div>

            {/* =================================================
                DEVICE C
            ================================================= */}

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
                      {isHash
                        ? "Captured Hash:"
                        : "Captured Ciphertext:"}
                    </strong>

                    <br />
                    <br />

                    <span className="ciphertext">
                      {result.deviceC?.interceptedData ||
                        "No intercepted data"}
                    </span>

                    <br />
                    <br />

                    <strong>
                      Status:
                    </strong>

                    <br />

                    {result.deviceC?.status ||
                      "Traffic intercepted."}
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

            {/* =================================================
                ARROW
            ================================================= */}

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

            {/* =================================================
                DEVICE B
            ================================================= */}

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
                      {isHash
                        ? "HASH RESULT"
                        : "DECRYPTION SUCCESSFUL"}
                    </strong>

                    <br />
                    <br />

                    <strong>
                      {isHash
                        ? "Result:"
                        : "Recovered Message:"}
                    </strong>

                    <br />
                    <br />

                    {result.deviceB?.decryptedMessage ||
                      result.deviceB?.message ||
                      "No result returned."}

                    <br />
                    <br />

                    <strong>
                      Status:
                    </strong>

                    <br />

                    {result.deviceB?.status ||
                      "Processing completed."}
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

        {/* =================================================
            SIMULATION STATUS
        ================================================= */}

        <section className="status-section">

          <h2>
            Simulation Status
          </h2>

          {loading && (
            <div className="status-box">

              <p>
                ● RUNNING
              </p>

              Processing secure communication...

            </div>
          )}

          {!loading && !result && !error && (
            <div className="status-box">

              <p>
                ● READY
              </p>

              Select an algorithm and start the simulation.

            </div>
          )}

          {result && (
            <div className="status-box success-status">

              <p>
                ● SUCCESS
              </p>

              {isHash
                ? `${result.algorithm} hash generated successfully.`
                : `${result.algorithm} encryption and decryption completed successfully.`}

            </div>
          )}

          {error && (
            <div className="status-box error-status">

              <p>
                ● ERROR
              </p>

              {error}

            </div>
          )}

        </section>

        {/* =================================================
            PERFORMANCE ANALYTICS
        ================================================= */}

        {result && result.metrics && currentMetrics && (

          <section className="analytics-section">

            <div className="analytics-heading">

              <div>

                <h2>
                  Performance Analytics
                </h2>

                <p>
                  Detailed performance measurements for the
                  current {result.algorithm} simulation.
                </p>

              </div>

            </div>

            {/* =================================================
                KPI CARDS
            ================================================= */}

            <div className="metrics-container">

              <div className="metric-card">

                <h4>
                  Algorithm
                </h4>

                <p>
                  {result.algorithm}
                </p>

              </div>

              <div className="metric-card">

                <h4>
                  Encryption / Hash Time
                </h4>

                <p>
                  {currentMetrics.encryptionTime.toFixed(3)}
                  {" ms"}
                </p>

              </div>

              <div className="metric-card">

                <h4>
                  Decryption / Processing
                </h4>

                <p>
                  {currentMetrics.decryptionTime.toFixed(3)}
                  {" ms"}
                </p>

              </div>

              <div className="metric-card">

                <h4>
                  Total Processing Time
                </h4>

                <p>
                  {totalProcessingTime}
                  {" ms"}
                </p>

              </div>

              <div className="metric-card">

                <h4>
                  Plaintext Size
                </h4>

                <p>
                  {currentMetrics.plaintextSize}
                  {" bytes"}
                </p>

              </div>

              <div className="metric-card">

                <h4>
                  Ciphertext / Hash Size
                </h4>

                <p>
                  {currentMetrics.ciphertextSize}
                  {" bytes"}
                </p>

              </div>

              <div className="metric-card">

                <h4>
                  Size Overhead
                </h4>

                <p>
                  {currentOverhead}%
                </p>

              </div>

              <div className="metric-card">

                <h4>
                  Throughput
                </h4>

                <p>
                  {currentThroughput}
                  {" bytes/s"}
                </p>

              </div>

            </div>

            {/* =================================================
                CHARTS
            ================================================= */}

            {simulationHistory.length > 0 && (

              <div className="charts-grid">

                {/* TIME CHART */}

                <div className="chart-card">

                  <h3>
                    Encryption vs Decryption Time
                  </h3>

                  <p className="chart-description">
                    Processing time comparison across
                    completed simulations.
                  </p>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >

                    <BarChart data={timeChartData}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="algorithm"
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
                        dataKey="encryption"
                        name="Encryption / Hash"
                        fill="#7c3aed"
                      />

                      <Bar
                        dataKey="decryption"
                        name="Decryption / Processing"
                        fill="#10b981"
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

                {/* SIZE CHART */}

                <div className="chart-card">

                  <h3>
                    Message Size Comparison
                  </h3>

                  <p className="chart-description">
                    Plaintext size compared with encrypted
                    or hashed output size.
                  </p>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >

                    <BarChart data={sizeChartData}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="algorithm"
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
                        dataKey="plaintext"
                        name="Plaintext"
                        fill="#64748b"
                      />

                      <Bar
                        dataKey="ciphertext"
                        name="Ciphertext / Hash"
                        fill="#ef4444"
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              </div>
            )}

            {/* =================================================
                METRICS TABLE
            ================================================= */}

            <div className="metrics-table-section">

              <div className="table-header">

                <div>

                  <h3>
                    Detailed Metrics
                  </h3>

                  <p>
                    Performance comparison of all algorithms
                    tested during this session.
                  </p>

                </div>

                <span className="simulation-count">

                  {simulationHistory.length} simulation
                  {simulationHistory.length !== 1
                    ? "s"
                    : ""}

                </span>

              </div>

              <div className="table-wrapper">

                <table className="metrics-table">

                  <thead>

                    <tr>

                      <th>
                        Algorithm
                      </th>

                      <th>
                        Encryption
                      </th>

                      <th>
                        Decryption
                      </th>

                      <th>
                        Total Time
                      </th>

                      <th>
                        Plaintext
                      </th>

                      <th>
                        Ciphertext
                      </th>

                      <th>
                        Overhead
                      </th>

                      <th>
                        Throughput
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {simulationHistory.map(
                      (item) => (

                        <tr key={item.id}>

                          <td>

                            <span className="algorithm-name">
                              {item.algorithm}
                            </span>

                          </td>

                          <td>
                            {item.encryptionTime.toFixed(3)}
                            {" ms"}
                          </td>

                          <td>
                            {item.decryptionTime.toFixed(3)}
                            {" ms"}
                          </td>

                          <td>
                            {item.totalTime.toFixed(3)}
                            {" ms"}
                          </td>

                          <td>
                            {item.plaintextSize}
                            {" bytes"}
                          </td>

                          <td>
                            {item.ciphertextSize}
                            {" bytes"}
                          </td>

                          <td>
                            {item.sizeOverhead}%
                          </td>

                          <td>
                            {item.throughput}
                            {" B/s"}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>
        )}

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="footer">
        PBL Project • Cryptography & Network Security
      </footer>

    </div>
  );
}

export default App;
