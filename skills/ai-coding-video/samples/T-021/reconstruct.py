#!/usr/bin/env python3
"""T-021 环绕实景重建：用 Blender 5.3 渲染 CC0 雕塑环绕镜头 + 导出相机位姿，
再用 Brush (3D Gaussian Splatting) 训练真实高斯点云并打包进 assets/。

运行方式：
    python3 samples/T-021/reconstruct.py
"""
import json
import math
import os
import shutil
import struct
import subprocess
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"
BUILD = Path("/tmp/t021_build")
BLENDER = "/Applications/Blender.app/Contents/MacOS/blender"
BRUSH = str(Path.home() / ".local/bin/brush")
FFMPEG = str(Path.home() / ".local/bin/ffmpeg")

POLYHAVEN_FILES_API = "https://api.polyhaven.com/files/marble_bust_01"

BLENDER_SCRIPT = r'''
import bpy
import json
import math
import os
import sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
model_path, out_dir = argv[0], argv[1]
train_dir = os.path.join(out_dir, "train")
video_dir = os.path.join(out_dir, "video_frames")
os.makedirs(os.path.join(train_dir, "images"), exist_ok=True)
os.makedirs(video_dir, exist_ok=True)

# Clean scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# Render engine: EEVEE (fast + high quality on Apple Silicon Metal)
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scene.render.engine = eng
        break
    except Exception:
        pass

scene.view_settings.view_transform = "AgX" if "AgX" in [i.identifier for i in scene.view_settings.bl_rna.properties["view_transform"].enum_items] else "Filmic"
scene.view_settings.exposure = 0.15

# World: rich twilight museum courtyard sky
world = bpy.data.worlds.new("CourtyardWorld")
scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes
wl = world.node_tree.links
wn.clear()
w_out = wn.new("ShaderNodeOutputWorld")
w_bg = wn.new("ShaderNodeBackground")
w_bg.inputs["Strength"].default_value = 0.85
w_grad = wn.new("ShaderNodeTexGradient")
w_grad.gradient_type = "LINEAR"
w_ramp = wn.new("ShaderNodeValToRGB")
w_ramp.color_ramp.elements[0].position = 0.0
w_ramp.color_ramp.elements[0].color = (0.04, 0.06, 0.10, 1.0)
w_ramp.color_ramp.elements[1].position = 0.55
w_ramp.color_ramp.elements[1].color = (0.12, 0.17, 0.26, 1.0)
e2 = w_ramp.color_ramp.elements.new(1.0)
e2.color = (0.28, 0.22, 0.18, 1.0)
w_tex = wn.new("ShaderNodeTexCoord")
w_sep = wn.new("ShaderNodeSeparateXYZ")
w_map = wn.new("ShaderNodeMapRange")
w_map.inputs["From Min"].default_value = -0.2
w_map.inputs["From Max"].default_value = 0.8
wl.new(w_tex.outputs["Generated"], w_sep.inputs["Vector"])
wl.new(w_sep.outputs["Z"], w_map.inputs["Value"])
wl.new(w_map.outputs["Result"], w_ramp.inputs["Fac"])
wl.new(w_ramp.outputs["Color"], w_bg.inputs["Color"])
wl.new(w_bg.outputs["Background"], w_out.inputs["Surface"])

# Import CC0 marble bust
bpy.ops.import_scene.gltf(filepath=model_path)
imported = [o for o in bpy.context.scene.objects if o.type == "MESH"]

# Compute bounding box & normalize bust so base rests at z=0.42 (on pedestal) and height = 0.95m
min_v = Vector((1e9, 1e9, 1e9))
max_v = Vector((-1e9, -1e9, -1e9))
for obj in imported:
    for corner in obj.bound_box:
        wc = obj.matrix_world @ Vector(corner)
        for i in range(3):
            min_v[i] = min(min_v[i], wc[i])
            max_v[i] = max(max_v[i], wc[i])

size = max_v - min_v
scale_f = 0.95 / max(size.z, 1e-4)
center_xy = Vector(((min_v.x + max_v.x) * 0.5, (min_v.y + max_v.y) * 0.5, min_v.z))

parent = bpy.data.objects.new("BustRoot", None)
scene.collection.objects.link(parent)
for obj in imported:
    obj.parent = parent
parent.scale = (scale_f, scale_f, scale_f)
parent.location = (-center_xy.x * scale_f, -center_xy.y * scale_f, -center_xy.z * scale_f + 0.42)
bpy.context.view_layer.update()

# Pedestal (sculpted dark basalt cylinder with brass trim ring)
def make_mat(name, color, rough=0.45, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    return m

mat_ped = make_mat("BasaltPedestal", (0.11, 0.12, 0.15), rough=0.55, metal=0.05)
mat_brass = make_mat("BrassRing", (0.76, 0.58, 0.28), rough=0.28, metal=0.88)

bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.44, depth=0.42, location=(0, 0, 0.21))
ped = bpy.context.active_object
ped.name = "Pedestal"
ped.data.materials.append(mat_ped)

bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.52, depth=0.06, location=(0, 0, 0.03))
ped_base = bpy.context.active_object
ped_base.name = "PedestalBase"
ped_base.data.materials.append(mat_ped)

bpy.ops.mesh.primitive_torus_add(major_radius=0.445, minor_radius=0.012, major_segments=64, minor_segments=16, location=(0, 0, 0.415))
ring = bpy.context.active_object
ring.name = "BrassRing"
ring.data.materials.append(mat_brass)

# Courtyard floor with subtle procedural stone tiles (gives great texture for 3DGS + AR ground reference)
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=4.8, depth=0.04, location=(0, 0, -0.02))
floor = bpy.context.active_object
floor.name = "CourtyardFloor"
m_floor = bpy.data.materials.new("StoneFloor")
m_floor.use_nodes = True
fn = m_floor.node_tree.nodes
fl = m_floor.node_tree.links
bsdf = fn.get("Principled BSDF")
bsdf.inputs["Roughness"].default_value = 0.68
brick = fn.new("ShaderNodeTexBrick")
brick.inputs["Color1"].default_value = (0.16, 0.17, 0.20, 1.0)
brick.inputs["Color2"].default_value = (0.12, 0.13, 0.16, 1.0)
brick.inputs["Mortar"].default_value = (0.06, 0.07, 0.09, 1.0)
brick.inputs["Scale"].default_value = 7.0
brick.inputs["Mortar Size"].default_value = 0.018
texc = fn.new("ShaderNodeTexCoord")
fl.new(texc.outputs["Object"], brick.inputs["Vector"])
fl.new(brick.outputs["Color"], bsdf.inputs["Base Color"])
floor.data.materials.append(m_floor)

# 4 architectural low stone bollards around courtyard for depth parallax
for i in range(4):
    ang = math.radians(45 + i * 90)
    bx, by = 1.65 * math.cos(ang), 1.65 * math.sin(ang)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.09, depth=0.46, location=(bx, by, 0.23))
    b = bpy.context.active_object
    b.name = f"Bollard_{i}"
    b.data.materials.append(mat_ped)

# Three-point warm-cool museum lighting
def add_light(name, ltype, loc, energy, color, rot_target=(0, 0, 0.85), size=1.5):
    ld = bpy.data.lights.new(name=name, type=ltype)
    ld.energy = energy
    ld.color = color
    if ltype == "AREA":
        ld.size = size
    lo = bpy.data.objects.new(name=name, object_data=ld)
    scene.collection.objects.link(lo)
    lo.location = loc
    direction = Vector(rot_target) - lo.location
    lo.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return lo

add_light("KeySun", "AREA", (2.8, -2.6, 3.0), 320, (1.0, 0.88, 0.72), size=1.8)
add_light("FillSky", "AREA", (-3.0, 1.8, 2.2), 130, (0.62, 0.78, 1.0), size=2.4)
add_light("RimWarm", "AREA", (-1.0, 3.2, 2.4), 190, (1.0, 0.76, 0.54), size=1.4)
add_light("TopSoft", "AREA", (0.0, 0.0, 4.2), 80, (0.85, 0.90, 1.0), size=2.2)

# Camera
cam_data = bpy.data.cameras.new("OrbitCam")
cam_data.lens = 42.0
cam_data.sensor_width = 36.0
cam_data.clip_start = 0.05
cam_data.clip_end = 100.0
cam = bpy.data.objects.new("OrbitCam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

TARGET = Vector((0.0, 0.0, 0.82))

def set_cam_orbit(az_rad, elev_rad, radius):
    x = radius * math.cos(elev_rad) * math.cos(az_rad)
    y = radius * math.cos(elev_rad) * math.sin(az_rad)
    z = TARGET.z + radius * math.sin(elev_rad)
    cam.location = (x, y, z)
    direction = TARGET - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.view_layer.update()

# 1. Render 36 multi-view training images (24 eye-level + 12 elevated) for Brush 3DGS
TW, TH = 640, 360
scene.render.resolution_x = TW
scene.render.resolution_y = TH
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"

fl_x = (cam_data.lens / cam_data.sensor_width) * TW
fl_y = fl_x
camera_angle_x = 2.0 * math.atan(TW / (2.0 * fl_x))

train_frames = []
train_poses_export = []
idx = 0
for ring_i, (n_views, elev_deg, rad) in enumerate([(24, 14.0, 2.35), (12, 36.0, 2.45)]):
    for j in range(n_views):
        az = (j / n_views) * 2.0 * math.pi + (ring_i * math.pi / n_views)
        set_cam_orbit(az, math.radians(elev_deg), rad)
        fname = f"images/frame_{idx:03d}.png"
        scene.render.filepath = os.path.join(train_dir, fname)
        bpy.ops.render.render(write_still=True)
        mat = [list(row) for row in cam.matrix_world]
        train_frames.append({"file_path": fname, "transform_matrix": mat})
        train_poses_export.append({
            "pos": [round(cam.location.x, 4), round(cam.location.y, 4), round(cam.location.z, 4)],
            "az": round(az, 4),
            "elev": round(math.radians(elev_deg), 4),
            "r": rad,
        })
        idx += 1

transforms = {
    "camera_angle_x": camera_angle_x,
    "fl_x": fl_x,
    "fl_y": fl_y,
    "cx": TW * 0.5,
    "cy": TH * 0.5,
    "w": TW,
    "h": TH,
    "frames": train_frames,
}
with open(os.path.join(train_dir, "transforms.json"), "w") as f:
    json.dump(transforms, f, indent=2)

# 2. Render smooth 8-second (240 frames @ 30fps) 1280x720 orbit video
VW, VH = 1280, 720
N_VID = 240
scene.render.resolution_x = VW
scene.render.resolution_y = VH
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 90

v_fl_x = (cam_data.lens / cam_data.sensor_width) * VW
video_poses = []
for f_i in range(N_VID):
    u = f_i / N_VID
    az = -math.pi * 0.65 + u * 2.0 * math.pi
    elev = math.radians(15.0 + 7.5 * math.sin(u * 2.0 * math.pi))
    rad = 2.35 - 0.14 * math.sin(u * 2.0 * math.pi)
    set_cam_orbit(az, elev, rad)
    scene.render.filepath = os.path.join(video_dir, f"f_{f_i:04d}.jpg")
    bpy.ops.render.render(write_still=True)
    video_poses.append([
        round(cam.location.x, 5),
        round(cam.location.y, 5),
        round(cam.location.z, 5),
    ])

# Export exact cameras.json for Three.js AR projection & splat alignment
cam_export = {
    "w": VW,
    "h": VH,
    "fov_y_deg": round(math.degrees(2.0 * math.atan(VH / (2.0 * v_fl_x))), 4),
    "fl_x": round(v_fl_x, 3),
    "fps": 30,
    "frames": N_VID,
    "target": [TARGET.x, TARGET.y, TARGET.z],
    "train_cameras": train_poses_export,
    "orbit_positions": video_poses,
    "anchors": [
        {"id": "crown", "label": "雕像冠顶", "sub": "Z = 1.37 m", "pos": [0.0, 0.0, 1.37]},
        {"id": "shoulder", "label": "大理石肩线", "sub": "CC0 网格 · PBR", "pos": [0.24, -0.08, 0.86]},
        {"id": "pedestal", "label": "玄武岩基座", "sub": "Ø 0.88 m · H 0.42 m", "pos": [-0.44, -0.10, 0.42]},
        {"id": "bollard", "label": "广场参考标柱", "sub": "R = 1.65 m", "pos": [1.167, 1.167, 0.46]},
    ],
}
with open(os.path.join(out_dir, "cameras.json"), "w") as f:
    json.dump(cam_export, f, ensure_ascii=False, separators=(",", ":"))

print("BLENDER_DONE", idx, N_VID)
'''


def download_model():
    model_dir = BUILD / "model"
    req = urllib.request.Request(POLYHAVEN_FILES_API, headers={"User-Agent": "AI-Coding-Video/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        meta = json.load(r)
    entry = meta["gltf"]["1k"]["gltf"]
    files = {"marble_bust_01_1k.gltf": entry["url"]}
    for rel, info in entry.get("include", {}).items():
        files[rel] = info["url"]
    for rel, url in files.items():
        dst = model_dir / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if not dst.exists():
            print(f"Downloading {rel}...")
            r2 = urllib.request.Request(url, headers={"User-Agent": "AI-Coding-Video/1.0"})
            with urllib.request.urlopen(r2, timeout=60) as resp, open(dst, "wb") as f:
                shutil.copyfileobj(resp, f)
    return model_dir / "marble_bust_01_1k.gltf"


def run_blender(model_gltf: Path):
    script_path = BUILD / "blender_orbit.py"
    script_path.write_text(BLENDER_SCRIPT)
    cmd = [BLENDER, "-b", "--python", str(script_path), "--", str(model_gltf), str(BUILD)]
    print("Running Blender 5.3 orbit render...")
    subprocess.run(cmd, check=True)


def encode_orbit_video():
    out_mp4 = ASSETS / "orbit.mp4"
    cmd = [
        FFMPEG, "-y",
        "-framerate", "30",
        "-i", str(BUILD / "video_frames/f_%04d.jpg"),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-crf", "24", "-preset", "medium",
        "-an", "-map_metadata", "-1",
        "-movflags", "+faststart",
        str(out_mp4),
    ]
    subprocess.run(cmd, check=True)
    print(f"Encoded {out_mp4} ({out_mp4.stat().st_size / 1024:.1f} KB)")

    # Copy 3 stripped keyframes as multi-view photo assets
    for k_idx, frame_num in enumerate([0, 12, 28], start=1):
        src = BUILD / f"train/images/frame_{frame_num:03d}.png"
        dst = ASSETS / f"view_{k_idx:02d}.jpg"
        subprocess.run([
            FFMPEG, "-y", "-i", str(src),
            "-vf", "scale=640:-1", "-q:v", "4", "-map_metadata", "-1",
            str(dst),
        ], check=True)


def run_brush_3dgs():
    splat_dir = BUILD / "splat_out"
    tmp_dir = BUILD / "tmp"
    home_dir = BUILD / "home"
    splat_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir.mkdir(parents=True, exist_ok=True)
    (home_dir / "Library/Caches/cubecl/autotune").mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    env["TMPDIR"] = str(tmp_dir)
    env["HOME"] = str(home_dir)
    cmd = [
        BRUSH,
        str(BUILD / "train"),
        "--total-steps", "4000",
        "--max-splats", "45000",
        "--sh-degree", "0",
        "--export-every", "4000",
        "--export-path", str(splat_dir),
        "--export-name", "scene_{iter}.ply",
        "--seed", "42",
    ]
    (BUILD / "target/cubecl").mkdir(parents=True, exist_ok=True)
    print("Training 3D Gaussian Splatting with Brush on Apple Silicon Metal...")
    subprocess.run(cmd, check=True, env=env, cwd=str(BUILD))
    ply = splat_dir / "scene_4000.ply"
    if not ply.exists():
        plys = sorted(splat_dir.glob("*.ply"))
        if not plys:
            raise RuntimeError("Brush did not export a .ply file")
        ply = plys[-1]
    return ply


def pack_ply_to_bin(ply_path: Path, out_bin: Path, max_splats: int = 42000):
    """Parse binary little-endian 3DGS PLY from Brush and pack compact splats.bin.
    Format: uint32 count, followed by count records of:
        float32 x, y, z (Blender coords), float32 radius, uint8 r, g, b, a (20 bytes/splat).
    """
    with open(ply_path, "rb") as f:
        header_lines = []
        while True:
            line = f.readline().decode("ascii").strip()
            header_lines.append(line)
            if line == "end_header":
                break
        n_verts = 0
        props = []
        for l in header_lines:
            if l.startswith("element vertex "):
                n_verts = int(l.split()[-1])
            elif l.startswith("property "):
                parts = l.split()
                props.append((parts[1], parts[2]))
        type_map = {"float": "f", "double": "d", "uchar": "B", "int": "i", "uint": "I"}
        fmt = "<" + "".join(type_map[t] for t, _ in props)
        stride = struct.calcsize(fmt)
        names = [n for _, n in props]
        ix, iy, iz = names.index("x"), names.index("y"), names.index("z")
        ir, ig, ib = names.index("f_dc_0"), names.index("f_dc_1"), names.index("f_dc_2")
        iop = names.index("opacity")
        is0, is1, is2 = names.index("scale_0"), names.index("scale_1"), names.index("scale_2")

        SH_C0 = 0.28209479177387814
        raw = f.read(n_verts * stride)

    kept = []
    for i in range(n_verts):
        v = struct.unpack_from(fmt, raw, i * stride)
        x, y, z = v[ix], v[iy], v[iz]
        # Keep scene region around bust, pedestal, and courtyard
        if abs(x) > 3.2 or abs(y) > 3.2 or z < -0.25 or z > 2.4:
            continue
        op_raw = v[iop]
        alpha = 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, op_raw))))
        if alpha < 0.08:
            continue
        s = (math.exp(max(-10.0, min(2.0, v[is0]))) +
             math.exp(max(-10.0, min(2.0, v[is1]))) +
             math.exp(max(-10.0, min(2.0, v[is2])))) / 3.0
        radius = max(0.004, min(0.09, s * 2.1))
        r = int(max(0.0, min(1.0, 0.5 + SH_C0 * v[ir])) * 255)
        g = int(max(0.0, min(1.0, 0.5 + SH_C0 * v[ig])) * 255)
        b = int(max(0.0, min(1.0, 0.5 + SH_C0 * v[ib])) * 255)
        a = int(max(0.0, min(1.0, alpha)) * 255)
        # Prioritize bust/pedestal splats and higher opacity
        dist2 = x * x + y * y + (z - 0.82) ** 2
        score = alpha / (0.3 + dist2 * 0.4)
        kept.append((score, x, y, z, radius, r, g, b, a))

    kept.sort(key=lambda item: item[0], reverse=True)
    kept = kept[:max_splats]

    with open(out_bin, "wb") as out:
        out.write(struct.pack("<I", len(kept)))
        for _, x, y, z, radius, r, g, b, a in kept:
            out.write(struct.pack("<ffffBBBB", x, y, z, radius, r, g, b, a))

    print(f"Packed {len(kept)} / {n_verts} Gaussians -> {out_bin} ({out_bin.stat().st_size / 1024:.1f} KB)")


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    BUILD.mkdir(parents=True, exist_ok=True)
    model_gltf = download_model()
    run_blender(model_gltf)
    encode_orbit_video()
    shutil.copy2(BUILD / "cameras.json", ASSETS / "cameras.json")
    ply = run_brush_3dgs()
    pack_ply_to_bin(ply, ASSETS / "splats.bin")

    # Copy CC0 music track from T-015 if not already present
    music_dst = ASSETS / "music.mp3"
    music_src = HERE.parent / "T-015/assets/music.mp3"
    if not music_dst.exists() and music_src.exists():
        shutil.copy2(music_src, music_dst)
    print("ALL_DONE")


if __name__ == "__main__":
    main()
