from flask import Flask, request, jsonify
from flask_cors import CORS

from cryptography.fernet import Fernet

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.asymmetric import padding as rsa_padding
from cryptography.hazmat.primitives import hashes

import os
import base64
import time


app = Flask(__name__)
CORS(app)


# ============================================================
# FERNET SETUP
# ============================================================

FERNET_KEY = Fernet.generate_key()
fernet_cipher = Fernet(FERNET_KEY)


# ============================================================
# RSA SETUP
# ============================================================

RSA_PRIVATE_KEY = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)

RSA_PUBLIC_KEY = RSA_PRIVATE_KEY.public_key()


# ============================================================
# AES ENCRYPTION
# ============================================================

def aes_encrypt(message):

    # Generate AES-256 key
    key = os.urandom(32)

    # Generate Initialization Vector
    iv = os.urandom(16)

    # Convert plaintext into padded bytes
    padder = padding.PKCS7(128).padder()

    padded_data = (
        padder.update(message.encode("utf-8"))
        + padder.finalize()
    )

    # Create AES CBC cipher
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv)
    )

    encryptor = cipher.encryptor()

    ciphertext = (
        encryptor.update(padded_data)
        + encryptor.finalize()
    )

    # Combine IV + Ciphertext for transmission
    encrypted_data = base64.b64encode(
        iv + ciphertext
    ).decode("utf-8")

    return encrypted_data, key


# ============================================================
# AES DECRYPTION
# ============================================================

def aes_decrypt(encrypted_data, key):

    encrypted_bytes = base64.b64decode(
        encrypted_data.encode("utf-8")
    )

    # First 16 bytes are IV
    iv = encrypted_bytes[:16]

    # Remaining bytes are ciphertext
    ciphertext = encrypted_bytes[16:]

    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv)
    )

    decryptor = cipher.decryptor()

    padded_plaintext = (
        decryptor.update(ciphertext)
        + decryptor.finalize()
    )

    unpadder = padding.PKCS7(128).unpadder()

    plaintext = (
        unpadder.update(padded_plaintext)
        + unpadder.finalize()
    )

    return plaintext.decode("utf-8")


# ============================================================
# RSA ENCRYPTION
# ============================================================

def rsa_encrypt(message):

    encrypted_bytes = RSA_PUBLIC_KEY.encrypt(

        message.encode("utf-8"),

        rsa_padding.OAEP(

            mgf=rsa_padding.MGF1(
                algorithm=hashes.SHA256()
            ),

            algorithm=hashes.SHA256(),

            label=None
        )
    )

    ciphertext = base64.b64encode(
        encrypted_bytes
    ).decode("utf-8")

    return ciphertext


# ============================================================
# RSA DECRYPTION
# ============================================================

def rsa_decrypt(ciphertext):

    encrypted_bytes = base64.b64decode(
        ciphertext.encode("utf-8")
    )

    decrypted_bytes = RSA_PRIVATE_KEY.decrypt(

        encrypted_bytes,

        rsa_padding.OAEP(

            mgf=rsa_padding.MGF1(
                algorithm=hashes.SHA256()
            ),

            algorithm=hashes.SHA256(),

            label=None
        )
    )

    return decrypted_bytes.decode("utf-8")


# ============================================================
# HOME API
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "Multi-Cipher Network Simulator Backend Running",
        "supportedAlgorithms": [
            "Fernet",
            "AES-256",
            "RSA-2048"
        ]
    })


# ============================================================
# SIMULATION API
# ============================================================

@app.route("/api/simulate", methods=["POST"])
def simulate():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "message": "No data received"
            }), 400


        plaintext = data.get(
            "message",
            ""
        ).strip()


        algorithm = data.get(
            "algorithm",
            "Fernet"
        )


        # Validate message

        if not plaintext:

            return jsonify({
                "success": False,
                "message": "Message cannot be empty"
            }), 400


        # ====================================================
        # ENCRYPTION
        # ====================================================

        encryption_start = time.perf_counter()


        if algorithm == "Fernet":

            encrypted_bytes = fernet_cipher.encrypt(
                plaintext.encode("utf-8")
            )

            ciphertext = encrypted_bytes.decode(
                "utf-8"
            )


        elif algorithm == "AES":

            ciphertext, aes_key = aes_encrypt(
                plaintext
            )


        elif algorithm == "RSA":

            ciphertext = rsa_encrypt(
                plaintext
            )


        else:

            return jsonify({
                "success": False,
                "message": "Invalid algorithm selected"
            }), 400


        encryption_end = time.perf_counter()

        encryption_time = round(
            (encryption_end - encryption_start) * 1000,
            4
        )


        # ====================================================
        # ATTACKER INTERCEPTION
        # ====================================================

        intercepted_data = ciphertext


        # ====================================================
        # DECRYPTION
        # ====================================================

        decryption_start = time.perf_counter()


        if algorithm == "Fernet":

            decrypted_bytes = fernet_cipher.decrypt(
                ciphertext.encode("utf-8")
            )

            decrypted_message = decrypted_bytes.decode(
                "utf-8"
            )


        elif algorithm == "AES":

            decrypted_message = aes_decrypt(
                ciphertext,
                aes_key
            )


        elif algorithm == "RSA":

            decrypted_message = rsa_decrypt(
                ciphertext
            )


        decryption_end = time.perf_counter()

        decryption_time = round(
            (decryption_end - decryption_start) * 1000,
            4
        )


        # ====================================================
        # METRICS
        # ====================================================

        plaintext_size = len(
            plaintext.encode("utf-8")
        )

        ciphertext_size = len(
            ciphertext.encode("utf-8")
        )


        # ====================================================
        # SEND RESPONSE TO REACT
        # ====================================================

        return jsonify({

            "success": True,

            "algorithm": algorithm,

            "metrics": {

                "encryptionTimeMs": encryption_time,

                "decryptionTimeMs": decryption_time,

                "plaintextLength": plaintext_size,

                "ciphertextLength": ciphertext_size
            },


            "deviceA": {

                "role": "Sender",

                "plaintext": plaintext,

                "status": (
                    f"{algorithm} encryption successful"
                )
            },


            "deviceC": {

                "role": "Attacker",

                "interceptedData": intercepted_data,

                "status": (
                    "Ciphertext intercepted. "
                    "Plaintext remains protected."
                )
            },


            "deviceB": {

                "role": "Receiver",

                "decryptedMessage": decrypted_message,

                "status": (
                    f"{algorithm} decryption successful"
                )
            }

        })


    except Exception as error:

        print("ERROR:", error)

        return jsonify({

            "success": False,

            "message": str(error)

        }), 500


# ============================================================
# RUN FLASK SERVER
# ============================================================

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
