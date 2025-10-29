import { math } from "@survev/shared/utils/math";
import { type Vec2, v2 } from "@survev/shared/utils/v2";

export default class Camera {
    m_pos = v2.create(0, 0);
    m_ppu = 16;
    m_zoom = 1.5;
    m_targetZoom = 1.5;
    m_screenWidth = 1;
    m_screenHeight = 1;
    m_shakeEnabled = true;
    m_shakeInt = 0;

    m_interpEnabled = true;
    m_localRotationEnabled = false;
    m_interpInterval = 0;

    m_z() {
        return this.m_ppu * this.m_zoom;
    }

    m_pointToScreen(point: Vec2) {
        return {
            x: this.m_screenWidth * 0.5 + (point.x - this.m_pos.x) * this.m_z(),
            y: this.m_screenHeight * 0.5 - (point.y - this.m_pos.y) * this.m_z(),
        };
    }

    m_screenToPoint(screen: Vec2) {
        return {
            x: this.m_pos.x + (screen.x - this.m_screenWidth * 0.5) / this.m_z(),
            y: this.m_pos.y + (this.m_screenHeight * 0.5 - screen.y) / this.m_z(),
        };
    }

    m_pixels(p: number) {
        return p * this.m_zoom;
    }

    m_scaleToScreen(s: number) {
        return s * this.m_z();
    }

    m_setShakeEnabled(en: boolean) {
        this.m_shakeEnabled = en;
    }

    m_setInterpEnabled(en: boolean) {
        this.m_interpEnabled = en;
    }

    m_setRotationEnabled(en: boolean) {
        this.m_localRotationEnabled = en;
    }

    m_addShake(pos: Vec2, intensity: number) {
        const dist = v2.length(v2.sub(this.m_pos, pos));
        const newInt = math.delerp(dist, 40, 10) * intensity;
        this.m_shakeInt = Math.max(this.m_shakeInt, newInt);
    }

    m_applyShake() {
        if (this.m_shakeEnabled) {
            this.m_pos = v2.add(this.m_pos, v2.mul(v2.randomUnit(), this.m_shakeInt));
        }
        this.m_shakeInt = 0;
    }
}
export { Camera };
