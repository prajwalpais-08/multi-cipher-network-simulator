import os
import base64
import time
import json
import secrets

from flask import Flask, request, jsonify
from flask_cors import CORS

from cryptography.fernet import Fernet

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.asymmetric import padding as rsa_padding
from cryptography.hazmat.primitives import hashes

from Crypto.Cipher import DES


# ============================================================
# FLASK SETUP
# ============================================================

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
# ELGAMAL SETUP
# ============================================================
#
# EDUCATIONAL IMPLEMENTATION ONLY
#
# This is intended for demonstrating the concept of
# asymmetric encryption in the PBL simulator.
#
# It is NOT suitable for real-world security.
# ============================================================

ELGAMAL_P = 467
ELGAMAL_G = 2

ELGAMAL_PRIVATE_KEY = secrets.randbelow(
    ELGAMAL_P - 2
) + 1

ELGAMAL_PUBLIC_KEY = pow(
    ELGAMAL_G,
    ELGAMAL_PRIVATE_KEY,
    ELGAMAL_P
)


# ============================================================
# SHA-256
# ============================================================

def sha256_hash(message):
    digest = hashes.Hash(hashes.SHA256())

    digest.update(
        message.encode("utf-8")
    )

    return digest.finalize().hex()


# ============================================================
# SHA3-256
# ============================================================

def sha3_256_hash(message):
    digest = hashes.Hash(hashes.SHA3_256())

    digest.update(
        message.encode("utf-8")
    )

    return digest.finalize().hex()


# ============================================================
# AES-256 ENCRYPTION
# ============================================================

def aes_encrypt(message):
    key = os.urandom(32)
    iv = os.urandom(16)

    padder = padding.PKCS7(128).padder()

    padded_data = (
        padder.update(
            message.encode("utf-8")
        )
        + padder.finalize()
    )

    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv)
    )

    encryptor = cipher.encryptor()

    ciphertext = (
        encryptor.update(padded_data)
        + encryptor.finalize()
    )

    # Store IV together with ciphertext.
    encrypted_data = base64.b64encode(
        iv + ciphertext
    ).decode("utf-8")

    return encrypted_data, key


# ============================================================
# AES-256 DECRYPTION
# ============================================================

def aes_decrypt(encrypted_data, key):
    encrypted_bytes = base64.b64decode(
        encrypted_data.encode("utf-8")
    )

    if len(encrypted_bytes) < 32:
        raise ValueError("Invalid AES ciphertext.")

    iv = encrypted_bytes[:16]
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
# DES ENCRYPTION
# ============================================================

def des_encrypt(message, key):
    if not isinstance(key, str):
        raise ValueError("DES key must be a string.")

    key_bytes = key.encode("utf-8")

    if len(key_bytes) != 8:
        raise ValueError(
            "DES key must be exactly 8 characters."
        )

    cipher = DES.new(
        key_bytes,
        DES.MODE_ECB
    )

    message_bytes = message.encode("utf-8")

    padding_length = 8 - (
        len(message_bytes) % 8
    )

    padded_message = (
        message_bytes
        + bytes([padding_length]) * padding_length
    )

    ciphertext = cipher.encrypt(
        padded_message
    )

    return base64.b64encode(
        ciphertext
    ).decode("utf-8")


# ============================================================
# DES DECRYPTION
# ============================================================

def des_decrypt(ciphertext, key):
    if not isinstance(key, str):
        raise ValueError("DES key must be a string.")

    key_bytes = key.encode("utf-8")

    if len(key_bytes) != 8:
        raise ValueError(
            "DES key must be exactly 8 characters."
        )

    cipher = DES.new(
        key_bytes,
        DES.MODE_ECB
    )

    encrypted_bytes = base64.b64decode(
        ciphertext.encode("utf-8")
    )

    if len(encrypted_bytes) == 0 or len(encrypted_bytes) % 8 != 0:
        raise ValueError("Invalid DES ciphertext.")

    padded_plaintext = cipher.decrypt(
        encrypted_bytes
    )

    padding_length = padded_plaintext[-1]

    if padding_length < 1 or padding_length > 8:
        raise ValueError("Invalid DES padding.")

    if padded_plaintext[-padding_length:] != bytes(
        [padding_length] * padding_length
    ):
        raise ValueError("Invalid DES padding.")

    plaintext = padded_plaintext[:-padding_length]

    return plaintext.decode("utf-8")


# ============================================================
# RSA ENCRYPTION
# ============================================================

def rsa_encrypt(message):
    message_bytes = message.encode("utf-8")

    # RSA-2048 + OAEP/SHA-256 can encrypt at most
    # approximately 190 bytes per operation.
    if len(message_bytes) > 190:
        raise ValueError(
            "RSA-2048 can encrypt only short messages in this demo. "
            "Please use a message shorter than approximately 190 bytes."
        )

    encrypted_bytes = RSA_PUBLIC_KEY.encrypt(
        message_bytes,
        rsa_padding.OAEP(
            mgf=rsa_padding.MGF1(
                algorithm=hashes.SHA256()
            ),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

    return base64.b64encode(
        encrypted_bytes
    ).decode("utf-8")


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
# ELGAMAL ENCRYPTION
# ============================================================
#
# Each UTF-8 byte is encrypted separately.
#
# Since p = 467, every byte value 0-255 is supported.
# ============================================================

def elgamal_encrypt(message):
    message_bytes = message.encode("utf-8")

    encrypted_blocks = []

    for byte_value in message_bytes:

        # Random ephemeral key
        k = secrets.randbelow(
            ELGAMAL_P - 2
        ) + 1

        # c1 = g^k mod p
        c1 = pow(
            ELGAMAL_G,
            k,
            ELGAMAL_P
        )

        # Shared secret
        shared_secret = pow(
            ELGAMAL_PUBLIC_KEY,
            k,
            ELGAMAL_P
        )

        # c2 = m * shared_secret mod p
        c2 = (
            byte_value * shared_secret
        ) % ELGAMAL_P

        encrypted_blocks.append([
            c1,
            c2
        ])

    json_data = json.dumps(
        encrypted_blocks,
        separators=(",", ":")
    )

    return base64.b64encode(
        json_data.encode("utf-8")
    ).decode("utf-8")


# ============================================================
# ELGAMAL DECRYPTION
# ============================================================

def elgamal_decrypt(ciphertext):
    json_data = base64.b64decode(
        ciphertext.encode("utf-8")
    ).decode("utf-8")

    encrypted_blocks = json.loads(
        json_data
    )

    plaintext_bytes = bytearray()

    for block in encrypted_blocks:

        if not isinstance(block, list) or len(block) != 2:
            raise ValueError(
                "Invalid ElGamal ciphertext block."
            )

        c1 = int(block[0])
        c2 = int(block[1])

        # Shared secret
        shared_secret = pow(
            c1,
            ELGAMAL_PRIVATE_KEY,
            ELGAMAL_P
        )

        # Multiplicative inverse
        inverse = pow(
            shared_secret,
            ELGAMAL_P - 2,
            ELGAMAL_P
        )

        # Recover original byte
        message_value = (
            c2 * inverse
        ) % ELGAMAL_P

        if message_value > 255:
            raise ValueError(
                "Invalid ElGamal plaintext byte."
            )

        plaintext_bytes.append(
            message_value
        )

    return bytes(
        plaintext_bytes
    ).decode("utf-8")


# ============================================================
# CAESAR CIPHER ENCRYPTION
# ============================================================

def caesar_encrypt(message, shift):
    result = ""

    for char in message:

        if char.isupper():

            result += chr(
                (
                    ord(char)
                    - ord("A")
                    + shift
                ) % 26
                + ord("A")
            )

        elif char.islower():

            result += chr(
                (
                    ord(char)
                    - ord("a")
                    + shift
                ) % 26
                + ord("a")
            )

        else:

            result += char

    return result


# ============================================================
# CAESAR CIPHER DECRYPTION
# ============================================================

def caesar_decrypt(ciphertext, shift):
    return caesar_encrypt(
        ciphertext,
        -shift
    )


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
            "DES (User Key)",
            "RSA-2048",
            "ElGamal",
            "Caesar Cipher",
            "SHA-256",
            "SHA3-256"
        ]
    })


# ============================================================
# SIMULATION API
# ============================================================

@app.route("/api/simulate", methods=["POST"])
def simulate():

    try:

        # ====================================================
        # REQUEST DATA
        # ====================================================

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "No data received."
            }), 400

        plaintext = data.get(
            "message",
            ""
        )

        if not isinstance(plaintext, str):
            return jsonify({
                "success": False,
                "message": "Message must be text."
            }), 400

        plaintext = plaintext.strip()

        algorithm = data.get(
            "algorithm",
            "Fernet"
        )

        # ====================================================
        # DES USER KEY
        # ====================================================

        des_key = data.get(
            "desKey",
            "12345678"
        )

        if not isinstance(des_key, str):
            return jsonify({
                "success": False,
                "message": "DES key must be a string."
            }), 400

        if len(des_key.encode("utf-8")) != 8:
            return jsonify({
                "success": False,
                "message": "DES key must be exactly 8 characters."
            }), 400

        # ====================================================
        # CAESAR SHIFT
        # ====================================================

        try:
            caesar_shift = int(
                data.get(
                    "caesarShift",
                    3
                )
            )

        except (ValueError, TypeError):

            return jsonify({
                "success": False,
                "message": "Caesar shift must be a number."
            }), 400

        caesar_shift = caesar_shift % 26

        # ====================================================
        # VALIDATE MESSAGE
        # ====================================================

        if not plaintext:

            return jsonify({
                "success": False,
                "message": "Message cannot be empty."
            }), 400

        # ====================================================
        # NORMALIZE FRONTEND ALGORITHM NAMES
        # ====================================================
        #
        # This makes the backend compatible with both:
        #
        # AES / AES-256
        # DES / DES (User Key)
        # RSA / RSA-2048
        # Caesar / Caesar Cipher
        #
        # ====================================================

        algorithm_aliases = {
            "AES": "AES-256",
            "AES-256": "AES-256",

            "DES": "DES (User Key)",
            "DES (User Key)": "DES (User Key)",

            "RSA": "RSA-2048",
            "RSA-2048": "RSA-2048",

            "Caesar": "Caesar Cipher",
            "Caesar Cipher": "Caesar Cipher",

            "Fernet": "Fernet",
            "ElGamal": "ElGamal",
            "SHA-256": "SHA-256",
            "SHA3": "SHA3-256",
            "SHA3-256": "SHA3-256"
        }

        if algorithm not in algorithm_aliases:

            return jsonify({
                "success": False,
                "message": "Invalid algorithm selected."
            }), 400

        algorithm = algorithm_aliases[algorithm]

        # ====================================================
        # ENCRYPTION / HASHING
        # ====================================================

        encryption_start = time.perf_counter()

        aes_key = None

        # ----------------------------------------------------
        # FERNET
        # ----------------------------------------------------

        if algorithm == "Fernet":

            encrypted_bytes = fernet_cipher.encrypt(
                plaintext.encode("utf-8")
            )

            ciphertext = encrypted_bytes.decode("utf-8")

        # ----------------------------------------------------
        # AES-256
        # ----------------------------------------------------

        elif algorithm == "AES-256":

            ciphertext, aes_key = aes_encrypt(
                plaintext
            )

        # ----------------------------------------------------
        # DES
        # ----------------------------------------------------

        elif algorithm == "DES (User Key)":

            ciphertext = des_encrypt(
                plaintext,
                des_key
            )

        # ----------------------------------------------------
        # RSA-2048
        # ----------------------------------------------------

        elif algorithm == "RSA-2048":

            ciphertext = rsa_encrypt(
                plaintext
            )

        # ----------------------------------------------------
        # ELGAMAL
        # ----------------------------------------------------

        elif algorithm == "ElGamal":

            ciphertext = elgamal_encrypt(
                plaintext
            )

        # ----------------------------------------------------
        # CAESAR
        # ----------------------------------------------------

        elif algorithm == "Caesar Cipher":

            ciphertext = caesar_encrypt(
                plaintext,
                caesar_shift
            )

        # ----------------------------------------------------
        # SHA-256
        # ----------------------------------------------------

        elif algorithm == "SHA-256":

            ciphertext = sha256_hash(
                plaintext
            )

        # ----------------------------------------------------
        # SHA3-256
        # ----------------------------------------------------

        elif algorithm == "SHA3-256":

            ciphertext = sha3_256_hash(
                plaintext
            )

        encryption_end = time.perf_counter()

        encryption_time = round(
            (
                encryption_end
                - encryption_start
            ) * 1000,
            4
        )

        # ====================================================
        # DEVICE C - ATTACKER INTERCEPTION
        # ====================================================

        intercepted_data = ciphertext

        # ====================================================
        # DECRYPTION / PROCESSING
        # ====================================================

        decryption_start = time.perf_counter()

        # ----------------------------------------------------
        # FERNET
        # ----------------------------------------------------

        if algorithm == "Fernet":

            decrypted_bytes = fernet_cipher.decrypt(
                ciphertext.encode("utf-8")
            )

            decrypted_message = decrypted_bytes.decode(
                "utf-8"
            )

        # ----------------------------------------------------
        # AES-256
        # ----------------------------------------------------

        elif algorithm == "AES-256":

            decrypted_message = aes_decrypt(
                ciphertext,
                aes_key
            )

        # ----------------------------------------------------
        # DES
        # ----------------------------------------------------

        elif algorithm == "DES (User Key)":

            decrypted_message = des_decrypt(
                ciphertext,
                des_key
            )

        # ----------------------------------------------------
        # RSA-2048
        # ----------------------------------------------------

        elif algorithm == "RSA-2048":

            decrypted_message = rsa_decrypt(
                ciphertext
            )

        # ----------------------------------------------------
        # ELGAMAL
        # ----------------------------------------------------

        elif algorithm == "ElGamal":

            decrypted_message = elgamal_decrypt(
                ciphertext
            )

        # ----------------------------------------------------
        # CAESAR
        # ----------------------------------------------------

        elif algorithm == "Caesar Cipher":

            decrypted_message = caesar_decrypt(
                ciphertext,
                caesar_shift
            )

        # ----------------------------------------------------
        # SHA-256
        # ----------------------------------------------------

        elif algorithm in ["SHA-256", "SHA3-256"]:

            decrypted_message = (
                f"{algorithm} is a one-way hash. "
                "The original message cannot be decrypted."
            )

        decryption_end = time.perf_counter()

        decryption_time = round(
            (
                decryption_end
                - decryption_start
            ) * 1000,
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
        # ALGORITHM TYPE
        # ====================================================

        if algorithm in [
            "Fernet",
            "AES-256",
            "DES (User Key)"
        ]:

            algorithm_type = "Symmetric Encryption"

        elif algorithm in [
            "RSA-2048",
            "ElGamal"
        ]:

            algorithm_type = "Asymmetric Encryption"

        elif algorithm == "Caesar Cipher":

            algorithm_type = "Classical Cipher"

        elif algorithm in ["SHA-256", "SHA3-256"]:

            algorithm_type = "Cryptographic Hash"

        else:

            algorithm_type = "Cryptographic Hash"

        # ====================================================
        # DEVICE A - SENDER
        # ====================================================

        if algorithm in ["SHA-256", "SHA3-256"]:

            sender_status = (
                f"{algorithm} hash generated successfully."
            )

        else:

            sender_status = (
                f"{algorithm} encryption successful."
            )

        # ====================================================
        # DEVICE C - ATTACKER
        # ====================================================

        if algorithm in ["SHA-256", "SHA3-256"]:

            attacker_status = (
                f"{algorithm} hash intercepted. "
                "Original message cannot be recovered "
                "through decryption."
            )

        elif algorithm == "Caesar Cipher":

            attacker_status = (
                "Ciphertext intercepted. "
                "Caesar Cipher is vulnerable to "
                "brute-force analysis."
            )

        elif algorithm == "DES (User Key)":

            attacker_status = (
                "DES ciphertext intercepted. "
                "DES is a legacy encryption algorithm."
            )

        elif algorithm == "ElGamal":

            attacker_status = (
                "ElGamal ciphertext intercepted. "
                "Private key is required for decryption."
            )

        elif algorithm == "RSA-2048":

            attacker_status = (
                "RSA-2048 ciphertext intercepted. "
                "Private key is required for decryption."
            )

        else:

            attacker_status = (
                "Ciphertext intercepted. "
                "Plaintext remains protected."
            )

        # ====================================================
        # DEVICE B - RECEIVER
        # ====================================================

        if algorithm in ["SHA-256", "SHA3-256"]:

            receiver_status = (
                f"{algorithm} hash generated successfully. "
                "Original message cannot be recovered."
            )

        else:

            receiver_status = (
                f"{algorithm} decryption successful."
            )

        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "algorithm": algorithm,

            "algorithmType": algorithm_type,

            "metrics": {

                "encryptionTimeMs":
                    encryption_time,

                "decryptionTimeMs":
                    decryption_time,

                "plaintextLength":
                    plaintext_size,

                "ciphertextLength":
                    ciphertext_size
            },

            # =================================================
            # DEVICE A
            # =================================================

            "deviceA": {

                "role": "Sender",

                "plaintext": plaintext,

                "status": sender_status
            },

            # =================================================
            # DEVICE C
            # =================================================

            "deviceC": {

                "role": "Attacker",

                "interceptedData": intercepted_data,

                "status": attacker_status
            },

            # =================================================
            # DEVICE B
            # =================================================

            "deviceB": {

                "role": "Receiver",

                "decryptedMessage": decrypted_message,

                "status": receiver_status
            }
        })

    # ========================================================
    # ERROR HANDLING
    # ========================================================

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
