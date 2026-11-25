"""C-199 Manim 数学几何证明：单位圆与正弦波联动展开（横屏 16:9 / 竖屏 9:16 自适应）"""
import math
import os
from manim import (
    Axes,
    Circle,
    Create,
    DashedLine,
    Dot,
    FadeIn,
    Line,
    Scene,
    Text,
    VGroup,
    ValueTracker,
    always_redraw,
    config,
    linear,
    UP,
    DOWN,
    BLUE_C,
    GOLD,
    GREY_B,
    TEAL_A,
    WHITE,
    YELLOW,
)

PORTRAIT = os.environ.get("MANIM_AR", "16x9") == "9x16"


class UnitCircleSineProof(Scene):
    def construct(self):
        self.camera.background_color = "#0b1020"

        if PORTRAIT:
            title = Text("单位圆 · 正弦波联动", font="PingFang SC", font_size=34, color=WHITE).to_edge(UP, buff=0.6)
            sub = Text("Manim CE  |  y = sin(θ)", font="Menlo", font_size=20, color=TEAL_A).next_to(title, DOWN, buff=0.22)
            c_center = [0.0, 2.1, 0.0]
            rad = 1.65
            axes = Axes(
                x_range=[0, 2 * math.pi, math.pi / 2],
                y_range=[-1.3, 1.3, 1],
                x_length=5.6,
                y_length=3.3,
                axis_config={"color": GREY_B, "stroke_width": 2},
                tips=False,
            ).move_to([0.0, -2.6, 0.0])
        else:
            title = Text("单位圆 · 正弦波联动", font="PingFang SC", font_size=36, color=WHITE).to_edge(UP, buff=0.45)
            sub = Text("Manim CE  |  y = sin(θ)", font="Menlo", font_size=20, color=TEAL_A).next_to(title, DOWN, buff=0.18)
            c_center = [-3.8, -0.35, 0.0]
            rad = 1.85
            axes = Axes(
                x_range=[0, 2 * math.pi, math.pi / 2],
                y_range=[-1.3, 1.3, 1],
                x_length=6.6,
                y_length=3.7,
                axis_config={"color": GREY_B, "stroke_width": 2},
                tips=False,
            ).move_to([2.4, -0.35, 0.0])

        circle = Circle(radius=rad, color=BLUE_C, stroke_width=3.5).move_to(c_center)
        c_h = Line([c_center[0] - rad * 1.18, c_center[1], 0], [c_center[0] + rad * 1.18, c_center[1], 0], color=GREY_B, stroke_width=1.6)
        c_v = Line([c_center[0], c_center[1] - rad * 1.18, 0], [c_center[0], c_center[1] + rad * 1.18, 0], color=GREY_B, stroke_width=1.6)

        theta = ValueTracker(0.0)

        def circle_pt():
            t = theta.get_value()
            return [c_center[0] + rad * math.cos(t), c_center[1] + rad * math.sin(t), 0.0]

        def wave_pt():
            t = theta.get_value()
            return axes.c2p(t, math.sin(t))

        radius_line = always_redraw(lambda: Line(c_center, circle_pt(), color=GOLD, stroke_width=4))
        vert_leg = always_redraw(lambda: Line(
            [circle_pt()[0], c_center[1], 0.0],
            circle_pt(),
            color=TEAL_A,
            stroke_width=4,
        ))
        dot_c = always_redraw(lambda: Dot(circle_pt(), radius=0.09, color=YELLOW))
        dot_w = always_redraw(lambda: Dot(wave_pt(), radius=0.09, color=TEAL_A))
        connector = always_redraw(lambda: DashedLine(circle_pt(), wave_pt(), color=TEAL_A, stroke_width=2.2, dash_length=0.12))

        sine_curve = always_redraw(
            lambda: axes.plot(
                lambda x: math.sin(x),
                x_range=[0, max(0.02, theta.get_value())],
                color=TEAL_A,
                stroke_width=4.5,
            )
        )

        readout = always_redraw(
            lambda: Text(
                f"θ = {math.degrees(theta.get_value()):5.1f}°   sin(θ) = {math.sin(theta.get_value()):+.2f}",
                font="Menlo",
                font_size=22 if not PORTRAIT else 20,
                color=GOLD,
            ).to_edge(DOWN, buff=0.55 if not PORTRAIT else 0.75)
        )

        self.play(FadeIn(title, sub), Create(VGroup(c_h, c_v, circle, axes)), run_time=0.65)
        self.add(radius_line, vert_leg, dot_c, dot_w, connector, sine_curve, readout)
        self.play(theta.animate.set_value(2 * math.pi), run_time=3.45, rate_func=linear)
        self.wait(0.4)
