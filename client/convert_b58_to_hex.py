# convert_b58_to_hex.py
# Converts Endless Base58 addresses (pool, token metadata) to 32-byte Move-compatible hex

B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
B58_MAP = {c: i for i, c in enumerate(B58_ALPHABET)}

def b58_to_bytes(s: str) -> bytes:
    """Decode a Base58 string to bytes (big-endian), preserving leading zeros."""
    if not s:
        return b""
    n = 0
    for ch in s:
        if ch not in B58_MAP:
            raise ValueError(f"Invalid Base58 character: {ch!r} in {s!r}")
        n = n * 58 + B58_MAP[ch]
    
    # Convert to bytes
    if n == 0:
        b = b"\x00"
    else:
        byte_length = (n.bit_length() + 7) // 8
        b = n.to_bytes(byte_length, "big")
    
    # Handle leading '1's (which represent leading zero bytes)
    leading_zeros = 0
    for ch in s:
        if ch == "1":
            leading_zeros += 1
        else:
            break
    if leading_zeros:
        b = (b"\x00" * leading_zeros) + b
    
    return b

def base58_to_move_object_hex(s: str) -> str:
    """Convert Endless Base58 address to 32-byte left-padded hex (Move format)."""
    b = b58_to_bytes(s)
    if len(b) > 32:
        raise ValueError(f"Decoded length {len(b)} > 32 bytes for: {s!r}")
    # Left-pad to 32 bytes (Move expects fixed 32-byte object IDs)
    b32 = b.rjust(32, b"\x00")
    return "0x" + b32.hex()

if __name__ == "__main__":
    # Add all your Base58 addresses here
    inputs = {
        # Pool Addresses
        "POOL_EDS_USDT": "6ayE94veQ41KD4S87piMvxvYhmiEww4fz54wwRaMjBp5",
        "POOL_USDT_VDEP": "AzSp299Yy9mMEnhGZF4gUaZN19qdgZqcKJ5rTzV6CadR",
        
        # Token Metadata (FA Object IDs)
        "USDT_METADATA": "USDTnzE4avqSfzsyePxPw3MFvHhe1CMEZafKRCgkpM9",
        "EDS_METADATA": "ENDLESSsssssssssssssssssssssssssssssssssssss",
        "VDEP_METADATA": "VDEP88Df7aLwSSi7VXf9xxEuH4CWhw9bDyt5A34AD6c",
    }

    print("=== Endless Base58 → Move Hex Converter ===\n")
    for name, address in inputs.items():
        try:
            hex_result = base58_to_move_object_hex(address)
            print(f"{name}:")
            print(f"  Base58: {address}")
            print(f"  Hex   : {hex_result}")
            print()
        except Exception as e:
            print(f"{name}: ERROR → {e}\n")