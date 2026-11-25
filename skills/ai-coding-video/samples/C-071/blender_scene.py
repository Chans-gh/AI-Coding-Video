"""C-071 Blender 程序化场景：纯 Python 从零建模（无任何外部资产）——
灰模搭建延时 → 夜景湖面倒影、远山、湖畔凉亭与三组程序化烟花绽放。
"""
import bpy
import math
import os
import random
import sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
ar, out_dir = argv[0], argv[1]
PORTRAIT = ar == "9x16"
W, H = (720, 1280) if PORTRAIT else (1280, 720)
FPS = 30
N_FRAMES = 135  # 4.5s

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scene.render.engine = eng
        break
    except Exception:
        pass

scene.render.resolution_x = W
scene.render.resolution_y = H
scene.render.resolution_percentage = 100
scene.render.fps = FPS
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 90
scene.view_settings.view_transform = "AgX" if "AgX" in [i.identifier for i in scene.view_settings.bl_rna.properties["view_transform"].enum_items] else "Filmic"
scene.view_settings.exposure = 0.25

# World shader: blends from neutral studio clay gray -> deep indigo starry night sky
world = bpy.data.worlds.new("NightWorld")
scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes
wl = world.node_tree.links
wn.clear()
w_out = wn.new("ShaderNodeOutputWorld")
w_bg = wn.new("ShaderNodeBackground")
w_bg.inputs["Strength"].default_value = 1.0
w_mix = wn.new("ShaderNodeMix")
w_mix.data_type = "RGBA"
w_mix.inputs[6].default_value = (0.36, 0.39, 0.44, 1.0)  # Clay preview sky
w_mix.inputs[7].default_value = (0.012, 0.020, 0.055, 1.0)  # Deep night sky
wl.new(w_mix.outputs[2], w_bg.inputs["Color"])
wl.new(w_bg.outputs["Background"], w_out.inputs["Surface"])

# Helper: procedural clay-to-final blended material
clay_mix_nodes = []


def make_blend_mat(name, final_col, rough=0.45, metal=0.0, emit_col=None, emit_str=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    ns = m.node_tree.nodes
    ls = m.node_tree.links
    bsdf = ns.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal

    mix = ns.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs[6].default_value = (0.62, 0.64, 0.68, 1.0)  # Matte clay
    mix.inputs[7].default_value = (*final_col, 1.0)
    ls.new(mix.outputs[2], bsdf.inputs["Base Color"])
    clay_mix_nodes.append(("color", mix.inputs[0]))

    if emit_col is not None and emit_str > 0:
        bsdf.inputs["Emission Color"].default_value = (*emit_col, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 0.0
        clay_mix_nodes.append(("emit", bsdf.inputs["Emission Strength"], emit_str))
    return m


# 1. Procedural distant mountain range (multi-octave sine ridge mesh)
mesh_mtn = bpy.data.meshes.new("MountainsMesh")
nx, ny = 64, 24
verts, faces = [], []
for j in range(ny):
    v = j / (ny - 1)
    y = 9.0 + v * 16.0
    for i in range(nx):
        u = (i / (nx - 1)) * 2.0 - 1.0
        x = u * 22.0
        ridge = (
            math.sin(u * 4.5 + 0.6) * 1.4
            + math.cos(u * 9.2 - 0.4) * 0.65
            + math.sin(u * 17.0 + v * 6.0) * 0.28
        )
        env = math.sin(v * math.pi) * (0.55 + 0.45 * math.cos(u * 1.1))
        z = max(-0.1, (1.8 + ridge) * env * 1.85)
        verts.append((x, y, z))
for j in range(ny - 1):
    for i in range(nx - 1):
        a = j * nx + i
        faces.append((a, a + 1, a + nx + 1, a + nx))
mesh_mtn.from_pydata(verts, [], faces)
mesh_mtn.update()
obj_mtn = bpy.data.objects.new("Mountains", mesh_mtn)
scene.collection.objects.link(obj_mtn)
for p in obj_mtn.data.polygons:
    p.use_smooth = True
mat_mtn = make_blend_mat("MountainMat", (0.04, 0.06, 0.12), rough=0.88)
obj_mtn.data.materials.append(mat_mtn)

# 2. Reflective night lake with subtle procedural wave bump
bpy.ops.mesh.primitive_plane_add(size=46, location=(0, 8, 0.0))
lake = bpy.context.active_object
lake.name = "Lake"
mat_lake = bpy.data.materials.new("LakeMat")
mat_lake.use_nodes = True
ln = mat_lake.node_tree.nodes
ll = mat_lake.node_tree.links
lbsdf = ln.get("Principled BSDF")
lbsdf.inputs["Base Color"].default_value = (0.02, 0.04, 0.08, 1.0)
lbsdf.inputs["Roughness"].default_value = 0.06
lbsdf.inputs["Metallic"].default_value = 0.25
noise = ln.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 18.0
noise.inputs["Detail"].default_value = 4.0
bump = ln.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.045
ll.new(noise.outputs["Fac"], bump.inputs["Height"])
ll.new(bump.outputs["Normal"], lbsdf.inputs["Normal"])
lake.data.materials.append(mat_lake)

# 3. Procedural lakeside pier & pavilion (pure primitives, zero external assets)
pav_parts = []
mat_wood = make_blend_mat("WoodMat", (0.14, 0.08, 0.05), rough=0.65)
mat_roof = make_blend_mat("RoofMat", (0.07, 0.09, 0.14), rough=0.45)
mat_lantern = make_blend_mat("LanternMat", (1.0, 0.72, 0.28), rough=0.2, emit_col=(1.0, 0.65, 0.20), emit_str=16.0)

# Pier deck
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.0, 3.8, 0.18), scale=(2.8, 2.6, 0.16))
deck = bpy.context.active_object
deck.data.materials.append(mat_wood)
pav_parts.append(deck)

# 4 pavilion columns
for cx in (-1.05, 1.05):
    for cy in (2.8, 4.8):
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.075, depth=1.65, location=(cx, cy, 1.05))
        col = bpy.context.active_object
        col.data.materials.append(mat_wood)
        pav_parts.append(col)

# Layered pagoda-style procedural roof
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=1.95, radius2=0.18, depth=0.85, location=(0.0, 3.8, 2.25), rotation=(0, 0, math.pi / 4))
roof = bpy.context.active_object
roof.data.materials.append(mat_roof)
pav_parts.append(roof)

# Warm glowing hanging lantern
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.16, location=(0.0, 3.8, 1.55))
lantern = bpy.context.active_object
lantern.data.materials.append(mat_lantern)
pav_parts.append(lantern)

# Warm point light inside lantern
ld_lan = bpy.data.lights.new("LanternLight", type="POINT")
ld_lan.color = (1.0, 0.68, 0.28)
ld_lan.energy = 0.0
lo_lan = bpy.data.objects.new("LanternLight", ld_lan)
scene.collection.objects.link(lo_lan)
lo_lan.location = (0.0, 3.8, 1.48)

# Studio clay sun (fades out as night arrives)
ld_clay = bpy.data.lights.new("ClaySun", type="SUN")
ld_clay.energy = 2.8
lo_clay = bpy.data.objects.new("ClaySun", ld_clay)
scene.collection.objects.link(lo_clay)
lo_clay.rotation_euler = (math.radians(48), 0, math.radians(-35))

# Cool moonlight
ld_moon = bpy.data.lights.new("MoonLight", type="SUN")
ld_moon.color = (0.48, 0.64, 1.0)
ld_moon.energy = 0.0
lo_moon = bpy.data.objects.new("MoonLight", ld_moon)
scene.collection.objects.link(lo_moon)
lo_moon.rotation_euler = (math.radians(32), 0, math.radians(145))

# 4. Procedural Fireworks: 3 bursts of glowing particles with spherical trails
rng = random.Random(71)
fw_specs = [
    {"t0": 1.90, "center": Vector((-2.6, 11.5, 4.9)), "color": (1.0, 0.78, 0.25), "n": 42, "rad": 2.4},
    {"t0": 2.58, "center": Vector((2.8, 12.2, 5.4)), "color": (0.20, 0.88, 1.0), "n": 46, "rad": 2.6},
    {"t0": 3.22, "center": Vector((0.1, 10.8, 6.0)), "color": (1.0, 0.34, 0.76), "n": 48, "rad": 2.7},
]
fw_particles = []
fw_lights = []
for b_idx, spec in enumerate(fw_specs):
    mat_fw = bpy.data.materials.new(f"FW_{b_idx}")
    mat_fw.use_nodes = True
    fbsdf = mat_fw.node_tree.nodes.get("Principled BSDF")
    fbsdf.inputs["Base Color"].default_value = (*spec["color"], 1.0)
    fbsdf.inputs["Emission Color"].default_value = (*spec["color"], 1.0)
    fbsdf.inputs["Emission Strength"].default_value = 32.0

    # Burst dynamic point light for lake reflection
    fl_d = bpy.data.lights.new(f"FWLight_{b_idx}", type="POINT")
    fl_d.color = spec["color"]
    fl_d.energy = 0.0
    fl_o = bpy.data.objects.new(f"FWLight_{b_idx}", fl_d)
    scene.collection.objects.link(fl_o)
    fl_o.location = spec["center"]
    fw_lights.append((spec["t0"], fl_d))

    for p_i in range(spec["n"]):
        # Fibonacci-like jittered sphere directions
        u = rng.uniform(-1, 1)
        phi = rng.uniform(0, 2 * math.pi)
        s = math.sqrt(max(0.0, 1 - u * u))
        dvec = Vector((s * math.cos(phi), s * math.sin(phi), u)) * rng.uniform(0.65, 1.05)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.065, location=spec["center"])
        pobj = bpy.context.active_object
        pobj.data.materials.append(mat_fw)
        pobj.scale = (0.001, 0.001, 0.001)
        fw_particles.append((spec["t0"], spec["center"], dvec, spec["rad"], pobj))

# Camera
cam_data = bpy.data.cameras.new("SceneCam")
cam_data.lens = 30.0 if PORTRAIT else 34.0
cam = bpy.data.objects.new("SceneCam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

# Render 135 deterministic frames
os.makedirs(out_dir, exist_ok=True)
for f_i in range(N_FRAMES):
    t = f_i / FPS
    # Clay -> Night lighting & material transition (1.35s .. 1.95s)
    night_p = max(0.0, min(1.0, (t - 1.35) / 0.60))
    night_s = night_p * night_p * (3 - 2 * night_p)

    w_mix.inputs[0].default_value = night_s
    ld_clay.energy = 2.8 * (1.0 - night_s)
    ld_moon.energy = 0.55 * night_s
    ld_lan.energy = 110.0 * night_s
    lbsdf.inputs["Roughness"].default_value = 0.45 * (1.0 - night_s) + 0.05 * night_s

    for item in clay_mix_nodes:
        if item[0] == "color":
            item[1].default_value = night_s
        elif item[0] == "emit":
            item[1].default_value = item[2] * night_s

    # Timelapse build-up animation during clay phase (0..1.25s)
    mtn_z = min(1.0, max(0.02, t / 0.55))
    obj_mtn.scale = (1.0, 1.0, mtn_z)
    for idx, part in enumerate(pav_parts):
        p_t = max(0.0, min(1.0, (t - (0.35 + idx * 0.11)) / 0.22))
        sc_p = 0.001 + 0.999 * (1 - (1 - p_t) ** 3)
        part.scale = (part.scale.x if idx == 0 and f_i == -1 else (2.8 if idx == 0 else 1.0) * sc_p,
                      (2.6 if idx == 0 else 1.0) * sc_p,
                      (0.16 if idx == 0 else 1.0) * sc_p)

    # Fireworks physics
    for t0, fl_d in fw_lights:
        dt = t - t0
        if 0.0 <= dt <= 1.35:
            fl_d.energy = 1400.0 * math.exp(-dt * 2.4)
        else:
            fl_d.energy = 0.0

    for t0, cpos, dvec, rmax, pobj in fw_particles:
        dt = t - t0
        if 0.0 <= dt <= 1.45:
            u = dt / 1.45
            ease = 1.0 - (1.0 - u) ** 2.6
            pos = cpos + dvec * (rmax * ease) + Vector((0, 0, -0.55 * dt * dt))
            pobj.location = pos
            sc_f = max(0.001, (1.0 - u) * 1.25)
            pobj.scale = (sc_f, sc_f, sc_f)
        else:
            pobj.scale = (0.001, 0.001, 0.001)

    # Gentle cinematic camera glide over the lake
    cam.location = (math.sin(t * 0.35) * 1.25, -4.6 + t * 0.24, 1.95 + math.sin(t * 0.4) * 0.14)
    tgt = Vector((0.0, 7.5, 2.35 if not PORTRAIT else 2.75))
    cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.view_layer.update()

    scene.render.filepath = os.path.join(out_dir, f"f_{f_i:04d}.jpg")
    bpy.ops.render.render(write_still=True)

print("BLENDER_C071_DONE", ar)
