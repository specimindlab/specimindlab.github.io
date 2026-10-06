#!/usr/bin/env python3
"""Test fixtures for the design-system test sheet (video/src/test). Everything here is drawn by
us in code: a clay mug as .glb (for <Turntable/>), and flat SVG illustrations standing in for an
input photo and a tool's output. Fixtures only; never used as a Live specimen.

    python3 scripts/make_test_assets.py
"""
import json
import math
import pathlib
import struct

import numpy as np

OUT = pathlib.Path(__file__).resolve().parent.parent / "video/public/test"


def lathe(profile, segments=64):
    """Revolve (r, y) points around the y axis. Returns verts, faces."""
    verts = []
    for j in range(segments):
        a = 2 * math.pi * j / segments
        for r, y in profile:
            verts.append((r * math.cos(a), y, r * math.sin(a)))
    n = len(profile)
    faces = []
    for j in range(segments):
        j2 = (j + 1) % segments
        for i in range(n - 1):
            a, b = j * n + i, j * n + i + 1
            c, d = j2 * n + i, j2 * n + i + 1
            faces += [(a, c, b), (b, c, d)]
    return np.array(verts, np.float32), np.array(faces, np.uint32)


def torus_arc(R, r, center, a0, a1, seg=40, rseg=20):
    verts, faces = [], []
    cx, cy, cz = center
    for i in range(seg + 1):
        u = a0 + (a1 - a0) * i / seg
        for j in range(rseg):
            v = 2 * math.pi * j / rseg
            x = (R + r * math.cos(v)) * math.cos(u)
            y = (R + r * math.cos(v)) * math.sin(u)
            z = r * math.sin(v)
            verts.append((cx + x, cy + y, cz + z))
    for i in range(seg):
        for j in range(rseg):
            j2 = (j + 1) % rseg
            a, b = i * rseg + j, i * rseg + j2
            c, d = (i + 1) * rseg + j, (i + 1) * rseg + j2
            faces += [(a, b, c), (b, d, c)]
    return np.array(verts, np.float32), np.array(faces, np.uint32)


def normals(v, f):
    n = np.zeros_like(v)
    tri = v[f]
    fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    for k in range(3):
        np.add.at(n, f[:, k], fn)
    l = np.linalg.norm(n, axis=1, keepdims=True)
    return (n / np.maximum(l, 1e-9)).astype(np.float32)


def write_glb(path, meshes):
    """meshes: list of (verts, faces, rgba). One node per mesh, one material each."""
    bin_chunks, views, accessors, gl_meshes, materials, nodes = [], [], [], [], [], []
    offset = 0

    def add(data, target):
        nonlocal offset
        raw = data.tobytes()
        pad = (-len(raw)) % 4
        bin_chunks.append(raw + b"\0" * pad)
        views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(raw), "target": target})
        offset += len(raw) + pad
        return len(views) - 1

    for k, (v, f, rgba) in enumerate(meshes):
        f = np.ascontiguousarray(f[:, ::-1])  # outward winding for glTF (CCW)
        n = normals(v, f)
        pv = add(v, 34962)
        accessors.append({"bufferView": pv, "componentType": 5126, "count": len(v), "type": "VEC3",
                          "min": v.min(0).tolist(), "max": v.max(0).tolist()})
        pn = add(n, 34962)
        accessors.append({"bufferView": pn, "componentType": 5126, "count": len(n), "type": "VEC3"})
        pi = add(f.astype(np.uint32).ravel(), 34963)
        accessors.append({"bufferView": pi, "componentType": 5125, "count": f.size, "type": "SCALAR"})
        base = len(accessors) - 3
        materials.append({"pbrMetallicRoughness": {"baseColorFactor": rgba, "metallicFactor": 0, "roughnessFactor": 0.8},
                          "doubleSided": True})
        gl_meshes.append({"primitives": [{"attributes": {"POSITION": base, "NORMAL": base + 1},
                                          "indices": base + 2, "material": k}]})
        nodes.append({"mesh": k})
    gltf = {"asset": {"version": "2.0", "generator": "specimind make_test_assets.py"},
            "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": gl_meshes,
            "materials": materials, "accessors": accessors, "bufferViews": views, "buffers": [{"byteLength": offset}]}
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * ((-len(js)) % 4)
    binary = b"".join(bin_chunks)
    total = 12 + 8 + len(js) + 8 + len(binary)
    with open(path, "wb") as fh:
        fh.write(struct.pack("<4sII", b"glTF", 2, total))
        fh.write(struct.pack("<I4s", len(js), b"JSON") + js)
        fh.write(struct.pack("<I4s", len(binary), b"BIN\0") + binary)


def mug():
    # Profile from outer bottom centre, up the outside, over the rim, down the inside.
    R, H, t = 0.5, 0.95, 0.045
    profile = [(0.0, 0.0), (R - 0.03, 0.0), (R, 0.03), (R, H - 0.01), (R - t / 2, H), (R - t, H - 0.01),
               (R - t, 0.08), (R - t - 0.03, 0.06), (0.0, 0.06)]
    body = lathe(profile)
    handle = torus_arc(0.25, 0.045, (R + 0.02, H * 0.5, 0.0), -math.pi * 0.62, math.pi * 0.62)
    return [(body[0], body[1], [0.79, 0.81, 0.75, 1]), (handle[0], handle[1], [0.68, 0.70, 0.65, 1])]


MUG_PHOTO = """<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
<rect width="600" height="800" fill="#B7B2A4"/><rect y="520" width="600" height="280" fill="#8F8878"/>
<ellipse cx="290" cy="600" rx="180" ry="34" fill="#6F6A5D" opacity="0.5"/>
<path d="M140 300 V560 Q140 610 290 610 Q440 610 440 560 V300 Z" fill="#E9E4D6"/>
<path d="M440 360 q110 0 110 90 q0 90 -110 90" fill="none" stroke="#D9D3C2" stroke-width="34"/>
<ellipse cx="290" cy="300" rx="150" ry="40" fill="#F4F0E6" stroke="#CFC8B5" stroke-width="4"/>
<ellipse cx="290" cy="304" rx="132" ry="30" fill="#5B3B26"/>
<path d="M160 330 V550" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="18" stroke-linecap="round"/>
</svg>"""

MESH_RESULT = """<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<rect width="800" height="600" fill="#F2F3EC"/>
<path d="M560 230 q120 0 120 90 q0 90 -120 90" fill="none" stroke="#AEB3A6" stroke-width="40"/>
<path d="M210 160 V430 Q210 480 385 480 Q560 480 560 430 V160 Z" fill="#C9CEC0" stroke="#151612" stroke-width="3"/>
<g stroke="#151612" stroke-opacity="0.35" stroke-width="1.6" fill="none">
<path d="M245 186 V452"/><path d="M290 196 V468"/><path d="M337 202 V476"/><path d="M385 204 V480"/><path d="M433 202 V476"/><path d="M480 196 V468"/><path d="M525 186 V452"/>
<path d="M210 215 Q385 265 560 215"/><path d="M210 270 Q385 320 560 270"/><path d="M210 325 Q385 375 560 325"/><path d="M210 380 Q385 430 560 380"/>
</g>
<ellipse cx="385" cy="160" rx="175" ry="48" fill="#E3E6DB" stroke="#151612" stroke-width="2"/>
<path d="M600 300 q40 -10 46 20" stroke="#151612" stroke-opacity="0.5" stroke-width="3" fill="none"/>
</svg>"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    write_glb(OUT / "mug.glb", mug())
    (OUT / "mug-photo.svg").write_text(MUG_PHOTO)
    (OUT / "mug-mesh.svg").write_text(MESH_RESULT)
    for p in sorted(OUT.iterdir()):
        print(p.name, p.stat().st_size)


if __name__ == "__main__":
    main()
