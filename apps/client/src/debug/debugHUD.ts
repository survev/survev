import * as PIXI from "pixi.js-legacy";
import type { ConfigManager } from "../config";
import type { Game } from "../game";
import type { Pool } from "../objects/objectPool";
import type { AbstractObject } from "../objects/player";
import {
    defaultLabelTextOptions,
    Graph,
    type GraphKey,
    type GraphOptions,
} from "./graph";

const padding = 6;

export class DebugHUD {
    container = new PIXI.Container();
    background = new PIXI.Sprite(PIXI.Texture.WHITE);
    contentContainer = new PIXI.Container();

    graphsContainer = new PIXI.Container();
    graphs: Graph[] = [];

    fpsGraph: Graph;
    frames: number[] = [];
    fpsTicker = 0;

    pingGraph: Graph;
    netInGraph: Graph;

    linesContainer = new PIXI.Container();
    infoLines: PIXI.Text[] = [];

    config: ConfigManager;

    // the teammate healthbars
    // used to move the debug HUD so it doesn't overlap
    topLeftDiv: HTMLDivElement;

    hudConfig() {
        return this.config.get("debugHUD")!;
    }

    constructor(config: ConfigManager) {
        this.config = config;

        this.container.position.set(padding, padding);
        this.container.addChild(this.background, this.contentContainer);
        this.contentContainer.position.set(padding, padding);
        this.contentContainer.addChild(this.linesContainer, this.graphsContainer);

        this.background.tint = 0;
        this.background.alpha = 0.5;

        this.fpsGraph = this.addGraph("fps", {
            fill: "rgba(255, 0, 0, 0.2)",
            stroke: "red",
        });

        this.topLeftDiv = document.getElementById("ui-top-left") as HTMLDivElement;

        const textPadding = 6;
        this.fpsGraph.addLabel((g) => {
            const min = `${Math.round(g.minValue)}`.padEnd(textPadding);
            const max = `${Math.round(g.maxValue)}`.padEnd(textPadding);
            const avg = `${Math.round(g.averageValue)}`.padEnd(textPadding);
            return `FPS:     Min: ${min} Max: ${max} Avg: ${avg}`;
        });

        this.pingGraph = this.addGraph("ping", {
            fill: "rgba(255, 0, 255, 0.2)",
            stroke: "magenta",
        });

        this.pingGraph.addLabel((g) => {
            const min = `${Math.round(g.minValue)}ms`.padEnd(textPadding);
            const max = `${Math.round(g.maxValue)}ms`.padEnd(textPadding);
            const avg = `${Math.round(g.averageValue)}ms`.padEnd(textPadding);
            return `Ping:    Min: ${min} Max: ${max} Avg: ${avg}`;
        });

        this.netInGraph = this.addGraph("netIn", {
            fill: "rgba(255, 255, 0, 0.2)",
            stroke: "yellow",
        });

        const formatBytes = (n: number) => {
            if (n > 1000) return `${(n / 1000).toFixed(1)}kB`.padEnd(textPadding);
            return `${Math.round(n)}B`.padEnd(textPadding);
        };
        this.netInGraph.addLabel((g) => {
            const min = formatBytes(g.minValue);
            const max = formatBytes(g.maxValue);
            const avg = formatBytes(g.averageValue);
            return `Net In:  Min: ${min} Max: ${max} Avg: ${avg}`;
        });

        this.onConfigModified();
    }

    onConfigModified() {
        const cfg = this.hudConfig();
        this.container.visible = cfg.enabled;

        for (const graph of this.graphs) {
            const graphCfg = cfg[graph.key as GraphKey];
            graph.toggleLabels(cfg.enabled && graphCfg.show);
            graph.toggleGraph(cfg.enabled && graphCfg.showGraph);
        }
    }

    m_update(dt: number, game: Game) {
        if (!this.container.visible) return;

        const cfg = this.hudConfig();

        if (cfg.fps.show || cfg.fps.showGraph) {
            this.frames.push(dt);
            this.fpsTicker += dt;
            // add an average FPS every 100 milliseconds
            // adding an entry every frame makes the graph go crazy and become kinda useless
            // specially on high refresh rates
            if (this.fpsTicker > 0.1) {
                const sum = this.frames.reduce((a, b) => a + b, 0);
                this.fpsGraph.addEntry(1 / (sum / this.frames.length));
                this.frames.length = 0;
                this.fpsTicker = 0;
            }
        }

        for (let i = 0; i < this.infoLines.length; i++) {
            this.infoLines[i].visible = false;
        }

        if (cfg.position) {
            const activePlayer = game.m_activePlayer;
            this.addLine(
                `Pos:     X: ${activePlayer.m_pos.x.toFixed(2)}   Y: ${activePlayer.m_pos.y.toFixed(2)}`,
            );
        }

        if (cfg.objectPools) {
            this.addLine("-- Objects     (Active / Allocated)");
            const addCount = (name: string, active: number, allocated: number) => {
                const pad = 20 - name.length;
                this.addLine(
                    `${name}: ${active.toString().padStart(pad)} / ${allocated.toString().padStart(4)}`,
                );
            };

            const addPool = (name: string, pool: Pool<AbstractObject>) => {
                addCount(name, pool.m_activeCount, pool.m_getPool().length);
            };

            addPool("Players", game.m_playerBarn.playerPool);
            addPool("Loot", game.m_lootBarn.lootPool);
            addPool("Projectiles", game.m_projectileBarn.projectilePool);
            addPool("Obstacles", game.m_map.m_obstaclePool);
            addPool("Buildings", game.m_map.m_buildingPool);
            addPool("Structures", game.m_map.m_structurePool);
            addPool("Decals", game.m_decalBarn.decalPool);
            addPool("Dead Bodies", game.m_deadBodyBarn.deadBodyPool);
            addPool("Smoke", game.m_smokeBarn.m_smokePool);
            addPool("Airdrops", game.m_airdropBarn.airdropPool);

            const activeParticles = game.m_particleBarn.particles.filter(
                (p) => p.active,
            ).length;
            addCount("Particles", activeParticles, game.m_particleBarn.particles.length);

            const activeBullets = game.m_bulletBarn.bullets.filter((b) => b.alive).length;
            addCount("Bullets", activeBullets, game.m_bulletBarn.bullets.length);

            const activeExplosions = game.m_explosionBarn.explosions.filter(
                (e) => e.active,
            ).length;
            addCount(
                "Explosions",
                activeExplosions,
                game.m_explosionBarn.explosions.length,
            );

            const activePlanes = game.m_planeBarn.planes.filter((p) => p.active).length;
            addCount("Planes", activePlanes, game.m_planeBarn.planes.length);
        }

        this.updateLayout();
    }

    updateLayout() {
        let textY = 0;
        for (let i = 0; i < this.infoLines.length; i++) {
            const line = this.infoLines[i];
            if (!line.visible) continue;
            line.y = textY;
            textY += line.height + 2;
        }

        this.graphsContainer.y = textY;
        for (let i = 0, y = 0; i < this.graphs.length; i++) {
            const graph = this.graphs[i];
            if (!graph.visible) continue;
            const bounds = graph.container.getLocalBounds();
            graph.y = y - bounds.top;
            y += bounds.height - bounds.top + 2;
        }

        const bounds = this.contentContainer.getLocalBounds();
        this.background.width = bounds.width + padding * 2;
        this.background.height = bounds.height + padding * 2;

        const topLeftBounds = this.topLeftDiv.getBoundingClientRect();
        this.container.y = topLeftBounds.bottom;
        this.container.x = topLeftBounds.left;
    }

    addGraph(key: GraphKey, options: Partial<GraphOptions>) {
        const graph = new Graph(key, options);
        this.graphsContainer.addChild(graph.container);
        this.graphs.push(graph);
        return graph;
    }

    addLine(text: string) {
        let line = this.infoLines.find((l) => !l.visible);
        if (!line) {
            line = new PIXI.Text();
            line.style = defaultLabelTextOptions;
            this.infoLines.push(line);
            this.linesContainer.addChild(line);
        }
        line.visible = true;
        line.text = text;
    }
}
