import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState(
    "Hello, this is my secret PBL project message!"
  );

  const [algorithm, setAlgorithm] = useState("Fernet");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");


  // =====================================================
  // START SIMULATION
  // =====================================================

  const startSimulation = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/simulate",
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


  return (
    <div className="app">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="header">

        <h1>
          Interactive Multi-Cipher Network Simulator
        </h1>

        <p>
          Cryptography & Network Attack Simulation Framework
        </p>

      </header>


      {/* ================================================= */}
      {/* MAIN CONTENT */}
      {/* ================================================= */}

      <main className="main-container">


        {/* ================================================= */}
        {/* MESSAGE INPUT */}
        {/* ================================================= */}

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

            </select>

          </div>


          {/* MESSAGE TEXTAREA */}

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Enter your confidential message..."
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


        {/* ================================================= */}
        {/* ALGORITHM INFO */}
        {/* ================================================= */}

        <div className="algorithm-badge">

          Active Cipher: {algorithm}

        </div>


        {/* ================================================= */}
        {/* NETWORK TOPOLOGY */}
        {/* ================================================= */}

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
                      ENCRYPTION SUCCESSFUL
                    </strong>

                    <br />
                    <br />

                    <strong>
                      Plaintext:
                    </strong>

                    <br />

                    {result.deviceA.plaintext}

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

                    {result.deviceA.status}

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
                Encrypted
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
                      Captured Ciphertext:
                    </strong>

                    <br />
                    <br />

                    <span className="ciphertext">
                      {result.deviceC.interceptedData}
                    </span>

                    <br />
                    <br />

                    <strong>
                      Status:
                    </strong>

                    <br />

                    {result.deviceC.status}

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
                      DECRYPTION SUCCESSFUL
                    </strong>

                    <br />
                    <br />

                    <strong>
                      Recovered Message:
                    </strong>

                    <br />
                    <br />

                    {result.deviceB.decryptedMessage}

                    <br />
                    <br />

                    <strong>
                      Status:
                    </strong>

                    <br />

                    {result.deviceB.status}

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


        {/* ================================================= */}
        {/* SIMULATION STATUS */}
        {/* ================================================= */}

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

              {result.algorithm} encryption and
              decryption completed successfully.

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


        {/* ================================================= */}
        {/* PERFORMANCE METRICS */}
        {/* ================================================= */}

        {result && result.metrics && (

          <section className="metrics-container">


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
                Encryption Time
              </h4>

              <p>
                {result.metrics.encryptionTimeMs} ms
              </p>

            </div>


            <div className="metric-card">

              <h4>
                Decryption Time
              </h4>

              <p>
                {result.metrics.decryptionTimeMs} ms
              </p>

            </div>


            <div className="metric-card">

              <h4>
                Plaintext Size
              </h4>

              <p>
                {result.metrics.plaintextLength} bytes
              </p>

            </div>


            <div className="metric-card">

              <h4>
                Ciphertext Size
              </h4>

              <p>
                {result.metrics.ciphertextLength} bytes
              </p>

            </div>


          </section>

        )}


      </main>


      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <footer className="footer">

        PBL Project • Cryptography & Network Security

      </footer>

    </div>
  );
}


export default App;