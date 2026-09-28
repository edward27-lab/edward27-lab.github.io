#!/usr/bin/env python3
"""
Procedural lunar surface baker.

Generates seamless equirectangular textures for the moon renderer:
  public/textures/moon/albedo.webp   (RGB colour)
  public/textures/moon/normal.webp   (tangent-space normal map, +Y up)
  public/textures/moon/height.webp   (grey height, used for vertex displacement)

Everything is evaluated on the unit sphere (3D noise, great-circle crater
distances) so there is no seam and no polar pinch.

Usage:
  python3 tools/bake_moon.py --width 4096 --seed 7
  (needs numpy, scipy, pillow)

Drop-in replacement: if you would rather use NASA's LROC photographic maps,
export them to the same three file names at the same equirectangular layout
(longitude 0 at the left edge, north at the top) and the renderer will use
them unchanged.
"""
import argparse
import math
import os
import time

import numpy as np
from PIL import Image
from scipy import ndimage

# ----------------------------------------------------------------------------
# 3D gradient noise (Perlin) vectorised with numpy
# ----------------------------------------------------------------------------

def _make_perm(rng):
    p = np.arange(256, dtype=np.int32)
    rng.shuffle(p)
    return np.concatenate([p, p]).astype(np.int32)


_GRADS = np.array([
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
    [1, 1, 0], [-1, 1, 0], [0, -1, 1], [0, -1, -1],
], dtype=np.float32)


def perlin3(x, y, z, perm):
    xi = np.floor(x).astype(np.int32)
    yi = np.floor(y).astype(np.int32)
    zi = np.floor(z).astype(np.int32)
    xf = (x - xi).astype(np.float32)
    yf = (y - yi).astype(np.float32)
    zf = (z - zi).astype(np.float32)
    xi &= 255
    yi &= 255
    zi &= 255

    def fade(t):
        return t * t * t * (t * (t * 6 - 15) + 10)

    u, v, w = fade(xf), fade(yf), fade(zf)

    def grad(hsh, dx, dy, dz):
        g = _GRADS[hsh & 15]
        return g[..., 0] * dx + g[..., 1] * dy + g[..., 2] * dz

    def h(ix, iy, iz):
        return perm[perm[perm[ix] + iy] + iz]

    n000 = grad(h(xi, yi, zi), xf, yf, zf)
    n100 = grad(h(xi + 1, yi, zi), xf - 1, yf, zf)
    n010 = grad(h(xi, yi + 1, zi), xf, yf - 1, zf)
    n110 = grad(h(xi + 1, yi + 1, zi), xf - 1, yf - 1, zf)
    n001 = grad(h(xi, yi, zi + 1), xf, yf, zf - 1)
    n101 = grad(h(xi + 1, yi, zi + 1), xf - 1, yf, zf - 1)
    n011 = grad(h(xi, yi + 1, zi + 1), xf, yf - 1, zf - 1)
    n111 = grad(h(xi + 1, yi + 1, zi + 1), xf - 1, yf - 1, zf - 1)

    x00 = n000 + u * (n100 - n000)
    x10 = n010 + u * (n110 - n010)
    x01 = n001 + u * (n101 - n001)
    x11 = n011 + u * (n111 - n011)
    y0 = x00 + v * (x10 - x00)
    y1 = x01 + v * (x11 - x01)
    return (y0 + w * (y1 - y0)).astype(np.float32)


def fbm3(px, py, pz, perm, octaves=6, lacunarity=2.0, gain=0.5, freq=1.0, ridged=False):
    out = np.zeros_like(px, dtype=np.float32)
    amp = 1.0
    f = freq
    norm = 0.0
    for _ in range(octaves):
        n = perlin3(px * f + 31.7, py * f + 17.3, pz * f + 5.1, perm)
        if ridged:
            n = 1.0 - np.abs(n)
            n = n * n
        out += amp * n
        norm += amp
        amp *= gain
        f *= lacunarity
    return out / norm


def sphere_points(width, height, rows=None):
    """Unit-sphere xyz for each texel (or a row slice)."""
    if rows is None:
        rows = (0, height)
    r0, r1 = rows
    lon = (np.arange(width, dtype=np.float32) + 0.5) / width * 2 * np.pi - np.pi
    lat = np.pi / 2 - (np.arange(r0, r1, dtype=np.float32) + 0.5) / height * np.pi
    lon2, lat2 = np.meshgrid(lon, lat)
    cl = np.cos(lat2)
    x = cl * np.cos(lon2)
    y = np.sin(lat2)
    z = cl * np.sin(lon2)
    return x, y, z, lon2, lat2


# ----------------------------------------------------------------------------
# Craters
# ----------------------------------------------------------------------------

def sample_craters(rng, count, r_min, r_max, slope=2.0):
    """Angular radii (radians) with a power-law size distribution."""
    u = rng.random(count)
    a = r_min ** (1 - slope)
    b = r_max ** (1 - slope)
    r = (a + u * (b - a)) ** (1 / (1 - slope))
    # uniform on sphere
    z = rng.uniform(-1, 1, count)
    t = rng.uniform(0, 2 * np.pi, count)
    s = np.sqrt(1 - z * z)
    x = s * np.cos(t)
    y = s * np.sin(t)
    lat = np.arcsin(z)
    lon = np.arctan2(y, x)
    age = rng.random(count)  # 0 = fresh, 1 = ancient
    return r, lat, lon, age


def stamp_craters(H, A, F, width, height, craters, perm, mare_mask, rng, log=print):
    """Add crater relief to H (height) and A (albedo). F collects 'freshness' for rays."""
    r_all, lat_all, lon_all, age_all = craters
    n = len(r_all)
    t0 = time.time()
    order = np.argsort(-r_all)  # big first so small ones overprint
    for k, i in enumerate(order):
        R = float(r_all[i])
        lat0 = float(lat_all[i])
        lon0 = float(lon_all[i])
        age = float(age_all[i])

        # crater density is lower on maria (younger lava surfaces)
        cy = int((0.5 - lat0 / np.pi) * height) % height
        cx = int((lon0 + np.pi) / (2 * np.pi) * width) % width
        if mare_mask[cy, cx] > 0.5 and rng.random() < 0.55:
            continue

        ext = 2.6 if R > 0.02 else 2.0  # ejecta reach in radii
        half_lat = R * ext
        r_lo = max(0, int((0.5 - (lat0 + half_lat) / np.pi) * height) - 1)
        r_hi = min(height, int((0.5 - (lat0 - half_lat) / np.pi) * height) + 2)
        cos_lat = max(np.cos(lat0), 1e-3)
        half_lon = min(np.pi, R * ext / cos_lat)
        c_lo = int((lon0 - half_lon + np.pi) / (2 * np.pi) * width) - 1
        c_hi = int((lon0 + half_lon + np.pi) / (2 * np.pi) * width) + 2
        if r_hi <= r_lo:
            continue
        cols = np.arange(c_lo, c_hi) % width
        rows = np.arange(r_lo, r_hi)
        lon = (cols + 0.5) / width * 2 * np.pi - np.pi
        lat = np.pi / 2 - (rows + 0.5) / height * np.pi
        lon2, lat2 = np.meshgrid(lon, lat)
        # great-circle distance (haversine)
        dlat = lat2 - lat0
        dlon = lon2 - lon0
        a = np.sin(dlat / 2) ** 2 + np.cos(lat2) * np.cos(lat0) * np.sin(dlon / 2) ** 2
        dist = 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))
        d = (dist / R).astype(np.float32)

        # irregular rim: modulate radius with noise around the azimuth
        az = np.arctan2(dlat, dlon * cos_lat).astype(np.float32)
        ph = lon0 * 7.3 + lat0 * 3.1
        wob = 1.0 + 0.02 * np.sin(az * 2 + ph) + 0.015 * np.sin(az * 3 + ph * 1.7) + 0.01 * np.sin(az * 4 + ph * 0.6)
        d = d / wob

        # profile parameters scale with size and age
        depth = 0.20 if R < 0.01 else (0.15 if R < 0.04 else 0.10)
        depth *= (1.0 - 0.75 * age)
        rim_h = 0.06 * (1.0 - 0.6 * age)
        rim_w = (0.10 + 0.08 * age) if R > 0.02 else (0.12 + 0.08 * age)
        floor = -depth * (0.55 if R > 0.03 else 1.0)  # big craters have flat floors

        cavity = depth * (d * d - 1.0)
        cavity = np.maximum(cavity, floor)
        # central peak for large craters
        if R > 0.035:
            peak = (depth * 0.55) * np.exp(-(d / 0.18) ** 2)
            cavity += peak * (1.0 - 0.5 * age)
        # a single slump terrace on the inner wall of big craters
        if R > 0.06:
            cavity += 0.012 * np.exp(-((d - 0.82) / 0.05) ** 2) * (1 - age)
        rim = rim_h * np.exp(-((d - 1.0) / rim_w) ** 2)
        ejecta = rim_h * 0.55 * np.exp(-(np.maximum(d - 1.0, 0)) * (2.0 if R > 0.02 else 2.6)) * (d > 1.0)
        # ejecta gets a hummocky, radially streaked texture (noise-based for the craters big enough to see it)
        if R > 0.012:
            xw = np.cos(lat2) * np.cos(lon2)
            yw = np.sin(lat2)
            zw = np.cos(lat2) * np.sin(lon2)
            ej = fbm3(xw.astype(np.float32), yw.astype(np.float32), zw.astype(np.float32), perm, octaves=3, freq=min(600.0, 7.0 / R))
            kk = 18.0 + 30.0 * ((lon0 * 3.7) % 1.0)
            ej_noise = (0.45 + 1.1 * np.clip(ej + 0.45, 0, 1)) * (0.75 + 0.25 * np.sin(az * kk + 5.0 * ej))
            ejecta = ejecta * ej_noise
            # bright ejecta blanket for fresh big craters
        else:
            ejecta = ejecta * (1.0 + 0.3 * np.sin(az * 9 + d * 17))
        inside = d < 1.0
        prof = np.where(inside, cavity + rim * 0.6, rim + ejecta)
        # smooth edge fall-off so windows do not show
        fall = np.clip((ext - d) / 0.6, 0, 1)
        prof = prof * fall * R  # scale height by radius (bigger craters are deeper in absolute terms)

        H[r_lo:r_hi, cols] += prof.astype(np.float32)

        # albedo: fresh craters have bright rims/ejecta and slightly dark floors
        fresh = 1.0 - age
        bright = (0.05 * np.exp(-((d - 1.05) / 0.35) ** 2) + 0.04 * np.exp(-np.maximum(d - 1, 0) * 1.5) * (d > 1)) * fresh * fresh
        dark_floor = -0.02 * (d < 0.85) * fresh - (0.05 * np.clip((0.8 - d) / 0.1, 0, 1) if R > 0.03 else 0.0)
        A[r_lo:r_hi, cols] += ((bright + dark_floor) * fall).astype(np.float32)
        if fresh > 0.85 and R > 0.012:
            F[r_lo:r_hi, cols] = np.maximum(F[r_lo:r_hi, cols], (fresh * (d < 1.2)).astype(np.float32))

        if (k + 1) % 5000 == 0:
            log(f"  craters {k + 1}/{n}  ({time.time() - t0:.1f}s)")


def stamp_rays(A, width, height, rng, ray_craters, perm, log=print):
    """Bright ray systems radiating from a few young craters."""
    for (R, lat0, lon0) in ray_craters:
        reach = R * rng.uniform(14, 26)
        half_lat = min(np.pi / 2, reach)
        r_lo = max(0, int((0.5 - (lat0 + half_lat) / np.pi) * height))
        r_hi = min(height, int((0.5 - (lat0 - half_lat) / np.pi) * height) + 1)
        cos_lat = max(np.cos(lat0), 1e-3)
        half_lon = min(np.pi, reach / cos_lat)
        c_lo = int((lon0 - half_lon + np.pi) / (2 * np.pi) * width)
        c_hi = int((lon0 + half_lon + np.pi) / (2 * np.pi) * width) + 1
        cols = np.arange(c_lo, c_hi) % width
        rows = np.arange(r_lo, r_hi)
        lon = (cols + 0.5) / width * 2 * np.pi - np.pi
        lat = np.pi / 2 - (rows + 0.5) / height * np.pi
        lon2, lat2 = np.meshgrid(lon, lat)
        dlat = lat2 - lat0
        dlon = (lon2 - lon0 + np.pi) % (2 * np.pi) - np.pi
        a = np.sin(dlat / 2) ** 2 + np.cos(lat2) * np.cos(lat0) * np.sin(dlon / 2) ** 2
        dist = 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))
        az = np.arctan2(dlat, dlon * cos_lat)
        n_rays = int(rng.integers(6, 13))
        angles = rng.uniform(0, 2 * np.pi, n_rays)
        widths = rng.uniform(0.07, 0.22, n_rays)
        lengths = rng.uniform(0.3, 1.0, n_rays) * reach
        ray = np.zeros_like(dist, dtype=np.float32)
        for ang, wdt, ln in zip(angles, widths, lengths):
            da = (az - ang + np.pi) % (2 * np.pi) - np.pi
            along = np.clip(dist / ln, 0, 1.5)
            prof = np.exp(-(da / wdt) ** 2) * np.exp(-along * 2.0) * (dist > R * 0.9)
            ray += prof.astype(np.float32)
        # a bright, diffuse halo of ejecta right around the crater
        ray += (0.9 * np.exp(-np.maximum(dist / R - 1.0, 0) * 0.8)).astype(np.float32)
        # break rays up with noise so they look streaky and splotchy
        x = np.cos(lat2) * np.cos(lon2)
        y = np.sin(lat2)
        z = np.cos(lat2) * np.sin(lon2)
        xs, ys, zs = x.astype(np.float32), y.astype(np.float32), z.astype(np.float32)
        streak = fbm3(xs, ys, zs, perm, octaves=4, freq=45.0) + 0.6 * fbm3(xs, ys, zs, perm, octaves=3, freq=160.0)
        ray *= np.clip(0.25 + 1.3 * np.clip(streak + 0.35, 0, 1), 0, 1.4)
        A[r_lo:r_hi, cols] += (0.10 * np.clip(ray, 0, 1.3)).astype(np.float32)
        log(f"  rays around crater R={R:.3f}")


# ----------------------------------------------------------------------------
# Main bake
# ----------------------------------------------------------------------------

def bake(width, seed, out_dir, log=print):
    height = width // 2
    rng = np.random.default_rng(seed)
    perm = _make_perm(rng)
    perm2 = _make_perm(rng)
    perm3 = _make_perm(rng)

    H = np.zeros((height, width), np.float32)   # height, arbitrary units
    A = np.zeros((height, width), np.float32)   # albedo offset
    F = np.zeros((height, width), np.float32)   # freshness mask

    # ---- base terrain and maria, computed in row chunks -------------------
    log("base terrain")
    mare = np.zeros((height, width), np.float32)
    chunk = max(64, height // 16)
    for r0 in range(0, height, chunk):
        r1 = min(height, r0 + chunk)
        x, y, z, lon2, lat2 = sphere_points(width, height, (r0, r1))
        # broad highland undulation + ridged medium detail + fine regolith
        broad = fbm3(x, y, z, perm, octaves=4, freq=2.2, gain=0.55)
        ridged = fbm3(x, y, z, perm2, octaves=5, freq=9.0, gain=0.5, ridged=True)
        fine = fbm3(x, y, z, perm3, octaves=5, freq=140.0, gain=0.55)
        H[r0:r1] = 0.02 * broad + 0.0015 * (ridged - 0.5) + 0.0011 * fine
        # maria: threshold of a low-frequency field, biased to one hemisphere (the "near side")
        m = fbm3(x, y, z, perm2, octaves=4, freq=1.25, gain=0.55)
        near = 0.5 - 0.5 * z  # -z here is +z in three.js, which faces the default camera
        field = m + 0.36 * near - 0.24 + 0.12 * fbm3(x, y, z, perm3, octaves=3, freq=4.0)
        edge = 0.06 * fbm3(x, y, z, perm3, octaves=3, freq=22.0) + 0.02 * fbm3(x, y, z, perm, octaves=2, freq=70.0)
        mare[r0:r1] = np.clip((field + edge - 0.13) / 0.025, 0, 1)
        # albedo mottling: slow patches in highlands, lava-flow streaks in maria
        mottle = fbm3(x, y, z, perm, octaves=3, freq=6.0, gain=0.6)
        A[r0:r1] += 0.03 * fine + 0.03 * broad + 0.05 * mottle

    # a few big round basins (Imbrium-like) that also become maria
    log("basins")
    basins = [(0.34, 0.28, 0.55), (0.22, -0.18, 1.15), (0.18, 0.12, -0.35), (0.15, -0.42, 0.25), (0.11, 0.05, 2.4)]
    x, y, z, lon2, lat2 = sphere_points(width, height)
    for bi, (R, lat0, lon0) in enumerate(basins):
        dlat = lat2 - lat0
        dlon = (lon2 - lon0 + np.pi) % (2 * np.pi) - np.pi
        a = np.sin(dlat / 2) ** 2 + np.cos(lat2) * np.cos(lat0) * np.sin(dlon / 2) ** 2
        dist = 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))
        az = np.arctan2(dlat, dlon * max(np.cos(lat0), 1e-3))
        # irregular outline so the lava fill does not read as a perfect disc
        wob = 1.0 + 0.22 * np.sin(az * 2 + bi) + 0.14 * np.sin(az * 3 + 1.7 * bi) + 0.09 * np.sin(az * 5 + 0.4 * bi)
        d = dist / (R * wob)
        disc = np.clip((1.0 - d) / 0.22, 0, 1)
        mare = np.maximum(mare, disc.astype(np.float32))
        d = dist / R
        # basin: broad depression, faint multi-ring
        H -= (0.02 * R / 0.2) * np.clip(1.15 - d, 0, 1).astype(np.float32)
        H += (0.006 * np.exp(-((d - 1.0) / 0.08) ** 2)).astype(np.float32)
        H += (0.003 * np.exp(-((d - 1.55) / 0.08) ** 2)).astype(np.float32)
    del x, y, z, lon2, lat2

    mare = ndimage.gaussian_filter(mare, sigma=width / 1500.0, mode=("nearest", "wrap"))
    # maria are smooth lava plains: flatten the terrain there (soft mask so the shore is a gentle slope)
    mare_soft = ndimage.gaussian_filter(mare, sigma=width / 160.0, mode=("nearest", "wrap"))
    H = H * (1.0 - 0.75 * mare_soft) - 0.004 * mare_soft
    # wrinkle ridges on the maria
    xw, yw, zw, _, _ = sphere_points(width, height)
    wr = fbm3(xw, yw, zw, perm3, octaves=3, freq=26.0, ridged=True)
    H += (0.0035 * (wr - 0.4) * mare).astype(np.float32)
    del xw, yw, zw, wr

    # ---- craters ----------------------------------------------------------
    log("craters")
    big = sample_craters(rng, 420, 0.02, 0.16, slope=2.3)
    mid = sample_craters(rng, 14000, 0.004, 0.02, slope=2.4)
    small = sample_craters(rng, int(120000 * (width / 4096) ** 2) + 6000, 1.6 * np.pi / width * 1.6, 0.004, slope=2.2)
    craters = tuple(np.concatenate([b, m, s]) for b, m, s in zip(big, mid, small))
    stamp_craters(H, A, F, width, height, craters, perm, mare, rng, log=log)

    # ray systems: pick a handful of the freshest mid-size craters
    r_all, lat_all, lon_all, age_all = craters
    cand = np.where((age_all < 0.12) & (r_all > 0.014) & (r_all < 0.06))[0]
    rng.shuffle(cand)
    ray_craters = [(float(r_all[i]), float(lat_all[i]), float(lon_all[i])) for i in cand[:7]]
    log("rays")
    stamp_rays(A, width, height, rng, ray_craters, perm, log=log)

    # ---- albedo colour ----------------------------------------------------
    log("albedo")
    base = 0.62 - 0.19 * mare + A
    # slope shading is done in the shader; here only tint by terrain type
    base += 0.02 * np.clip(H / 0.03, -1, 1)
    base = np.clip(base, 0.05, 1.0)
    highland_tint = np.array([1.00, 0.99, 0.97], np.float32)
    mare_tint = np.array([0.94, 0.96, 1.00], np.float32)
    tint = highland_tint[None, None, :] * (1 - mare[..., None]) + mare_tint[None, None, :] * mare[..., None]
    rgb = np.clip(base[..., None] * tint, 0, 1)
    rgb8 = (rgb * 255 + 0.5).astype(np.uint8)

    # ---- normal map -------------------------------------------------------
    log("normals")
    # gradients in texel units, corrected for longitude foreshortening
    lat = np.pi / 2 - (np.arange(height, dtype=np.float32) + 0.5) / height * np.pi
    cos_lat = np.maximum(np.cos(lat), 0.08)[:, None]
    dhx = (np.roll(H, -1, axis=1) - np.roll(H, 1, axis=1)) * 0.5 / cos_lat
    dhy = np.zeros_like(H)
    dhy[1:-1] = (H[:-2] - H[2:]) * 0.5  # +y = north = up the image
    strength = width * 0.28  # height units are in sphere radii; convert to per-texel slope
    nx = -dhx * strength
    ny = -dhy * strength
    nz = np.ones_like(H)
    ln = np.sqrt(nx * nx + ny * ny + nz * nz)
    normal = np.stack([nx / ln, ny / ln, nz / ln], axis=-1)
    # dither before quantising so gentle slopes do not band under directional light
    dither = rng.random(normal.shape, dtype=np.float32) - 0.5
    normal8 = np.clip((normal * 0.5 + 0.5) * 255 + dither + 0.5, 0, 255).astype(np.uint8)

    # ---- height (for displacement) ----------------------------------------
    hmin, hmax = np.percentile(H, 0.2), np.percentile(H, 99.8)
    h8 = np.clip(np.clip((H - hmin) / (hmax - hmin), 0, 1) * 255 + (rng.random(H.shape, dtype=np.float32) - 0.5) + 0.5, 0, 255).astype(np.uint8)

    os.makedirs(out_dir, exist_ok=True)
    Image.fromarray(rgb8, "RGB").save(os.path.join(out_dir, "albedo.png"), optimize=False)
    Image.fromarray(normal8, "RGB").save(os.path.join(out_dir, "normal.png"), optimize=False)
    Image.fromarray(h8, "L").save(os.path.join(out_dir, "height.png"), optimize=False)
    import json
    with open(os.path.join(out_dir, "meta.json"), "w") as f:
        json.dump({"width": int(width), "height": int(height), "heightRange": float(hmax - hmin), "seed": int(seed)}, f)
    log("done")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--width", type=int, default=4096)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "public", "textures", "moon"))
    args = ap.parse_args()
    t = time.time()
    bake(args.width, args.seed, args.out, log=lambda s: print(f"[{time.time() - t:6.1f}s] {s}", flush=True))
