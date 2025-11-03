import type { Graphics } from "pixi.js-legacy";
import type { Collider } from "../../../shared/utils/coldet";
import { collider } from "../../../shared/utils/collider";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { Camera } from "../camera";

enum kShapes {
    Line,
    Ray,
    Circle,
    Aabb,
}

interface BaseShape {
    color: number;
    fill: number;
}

interface LineShape extends BaseShape {
    type: kShapes.Line;
    start: Vec2;
    end: Vec2;
}

interface RayShape extends BaseShape {
    type: kShapes.Ray;
    pos: Vec2;
    dir: Vec2;
    len: number;
}

interface CircleShape extends BaseShape {
    type: kShapes.Circle;
    pos: Vec2;
    rad: number;
}

interface AabbShape extends BaseShape {
    type: kShapes.Aabb;
    min: Vec2;
    max: Vec2;
}

type Shape = LineShape | RayShape | CircleShape | AabbShape;

class DebugLines {
    shapes: Shape[] = [];

    addLine(start: Vec2, end: Vec2, color: number, fill = 0) {
        if (!IS_DEV) return;

        this.shapes.push({
            type: kShapes.Line,
            start: v2.copy(start),
            end: v2.copy(end),
            color,
            fill,
        });
    }

    addRay(pos: Vec2, dir: Vec2, len: number, color: number, fill = 0) {
        if (!IS_DEV) return;

        this.shapes.push({
            type: kShapes.Ray,
            pos: v2.copy(pos),
            dir: v2.copy(dir),
            len,
            color,
            fill,
        });
    }

    addCircle(pos: Vec2, rad: number, color: number, fill: number) {
        if (!IS_DEV) return;

        this.shapes.push({
            type: kShapes.Circle,
            pos: v2.copy(pos),
            rad,
            color,
            fill,
        });
    }

    addAabb(min: Vec2, max: Vec2, color: number, fill: number) {
        if (!IS_DEV) return;

        this.shapes.push({
            type: kShapes.Aabb,
            min: v2.copy(min),
            max: v2.copy(max),
            color,
            fill,
        });
    }

    addCollider(col: Collider, color: number, fill: number) {
        if (!IS_DEV) return;

        if (col.type == collider.Type.Aabb) {
            this.addAabb(col.min, col.max, color, fill);
        } else {
            this.addCircle(col.pos, col.rad, color, fill);
        }
    }

    m_render(camera: Camera, gfx: Graphics) {
        if (!IS_DEV) return;
        for (let i = 0; i < this.shapes.length; i++) {
            const shape = this.shapes[i];

            gfx.beginFill(shape.color);
            gfx.fill.alpha = shape.fill;
            gfx.lineStyle({
                width: 1,
                color: shape.color,
            });

            switch (shape.type) {
                case kShapes.Line: {
                    const start = camera.m_pointToScreen(shape.start);
                    gfx.moveTo(start.x, start.y);
                    const end = camera.m_pointToScreen(shape.end);
                    gfx.lineTo(end.x, end.y);
                    break;
                }
                case kShapes.Ray: {
                    const start = camera.m_pointToScreen(shape.pos);
                    gfx.moveTo(start.x, start.y);
                    const end = camera.m_pointToScreen(
                        v2.add(shape.pos, v2.mul(shape.dir, shape.len)),
                    );
                    gfx.lineTo(end.x, end.y);
                    break;
                }
                case kShapes.Aabb: {
                    const min = camera.m_pointToScreen(shape.min);
                    const max = camera.m_pointToScreen(shape.max);
                    gfx.moveTo(min.x, min.y)
                        .lineTo(max.x, min.y)
                        .lineTo(max.x, max.y)
                        .lineTo(min.x, max.y)
                        .lineTo(min.x, min.y);
                    break;
                }
                case kShapes.Circle: {
                    const pos = camera.m_pointToScreen(shape.pos);
                    const rad = camera.m_scaleToScreen(shape.rad);
                    gfx.drawCircle(pos.x, pos.y, rad);
                    break;
                }
            }
            gfx.closePath();
        }
    }

    flush() {
        this.shapes = [];
    }
}

export const debugLines = new DebugLines();
