export interface SoundDef {
    path: string;
    volume: number;
    canCoalesce?: boolean;
    maxInstances?: number;
    preload?: boolean;
    loadPriority?: number;
}
interface ChannelDef {
    volume: number;
    maxRange: number;
    list: string;
    type: "sound" | "music";
}

export interface ReverbDef {
    path?: string;
    volume: number;
    stereoSpread: number;
    echoVolume?: number;
    echoDelay?: number;
    echoLowPass?: number;
}

const Sounds: Record<string, Record<string, SoundDef>> = {
    players: {
        m9_01: {
            path: "audio/guns/m9_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        m9_reload_01: {
            path: "audio/guns/m9_reload_01.mp3",
            volume: 1,
        },
        m9_reload_02: {
            path: "audio/guns/m9_reload_02.mp3",
            volume: 1,
        },
        m9_switch_01: {
            path: "audio/guns/m9_switch_01.mp3",
            volume: 1,
        },
        m93r_01: {
            path: "audio/guns/m93r_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        m93r_reload_01: {
            path: "audio/guns/m93r_reload_01.mp3",
            volume: 1,
        },
        m93r_reload_02: {
            path: "audio/guns/m93r_reload_02.mp3",
            volume: 1,
        },
        m93r_switch_01: {
            path: "audio/guns/m93r_switch_01.mp3",
            volume: 1,
        },
        glock_01: {
            path: "audio/guns/glock_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        glock_reload_01: {
            path: "audio/guns/glock_reload_01.mp3",
            volume: 1,
        },
        glock_reload_02: {
            path: "audio/guns/glock_reload_02.mp3",
            volume: 1,
        },
        glock_switch_01: {
            path: "audio/guns/glock_switch_01.mp3",
            volume: 1,
        },
        p30l_01: {
            path: "audio/guns/p30l_01.mp3",
            volume: 1.2,
            maxInstances: 5,
        },
        p30l_reload_01: {
            path: "audio/guns/p30l_reload_01.mp3",
            volume: 1.4,
        },
        p30l_reload_02: {
            path: "audio/guns/p30l_reload_02.mp3",
            volume: 1.4,
        },
        p30l_switch_01: {
            path: "audio/guns/p30l_switch_01.mp3",
            volume: 1.5,
        },
        m1911_01: {
            path: "audio/guns/m1911_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        m1911_reload_01: {
            path: "audio/guns/m1911_reload_01.mp3",
            volume: 1,
        },
        m1911_reload_02: {
            path: "audio/guns/m1911_reload_02.mp3",
            volume: 1,
        },
        m1911_switch_01: {
            path: "audio/guns/m1911_switch_01.mp3",
            volume: 1,
        },
        ot38_01: {
            path: "audio/guns/ot38_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        ot38_reload_01: {
            path: "audio/guns/ot38_reload_01.mp3",
            volume: 1,
        },
        ot38_reload_02: {
            path: "audio/guns/ot38_reload_02.mp3",
            volume: 1,
        },
        ot38_switch_01: {
            path: "audio/guns/ot38_switch_01.mp3",
            volume: 1,
        },
        ots38_01: {
            path: "audio/guns/ots38_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        colt45_01: {
            path: "audio/guns/colt45_01.mp3",
            volume: 1,
        },
        colt45_reload_01: {
            path: "audio/guns/colt45_reload_01.mp3",
            volume: 1,
        },
        colt45_reload_02: {
            path: "audio/guns/colt45_reload_02.mp3",
            volume: 1,
        },
        colt45_switch_01: {
            path: "audio/guns/colt45_switch_01.mp3",
            volume: 1,
        },
        deagle_01: {
            path: "audio/guns/deagle_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        deagle_reload_01: {
            path: "audio/guns/deagle_reload_01.mp3",
            volume: 1,
        },
        deagle_reload_02: {
            path: "audio/guns/deagle_reload_02.mp3",
            volume: 1,
        },
        deagle_switch_01: {
            path: "audio/guns/deagle_switch_01.mp3",
            volume: 1,
        },
        flare_gun_01: {
            path: "audio/guns/flare_gun_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        flare_gun_reload_01: {
            path: "audio/guns/flare_gun_reload_01.mp3",
            volume: 1,
        },
        flare_gun_reload_02: {
            path: "audio/guns/flare_gun_reload_02.mp3",
            volume: 1,
        },
        ak47_01: {
            path: "audio/guns/ak47_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        ak47_reload_01: {
            path: "audio/guns/ak47_reload_01.mp3",
            volume: 1,
        },
        ak47_switch_01: {
            path: "audio/guns/ak47_switch_01.mp3",
            volume: 1,
        },
        an94_01: {
            path: "audio/guns/an94_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        an94_reload_01: {
            path: "audio/guns/an94_reload_01.mp3",
            volume: 1,
        },
        an94_switch_01: {
            path: "audio/guns/an94_switch_01.mp3",
            volume: 1,
        },
        groza_01: {
            path: "audio/guns/groza_01.mp3",
            volume: 0.95,
            maxInstances: 5,
        },
        groza_reload_01: {
            path: "audio/guns/groza_reload_01.mp3",
            volume: 1.1,
        },
        groza_switch_01: {
            path: "audio/guns/groza_switch_01.mp3",
            volume: 1.1,
        },
        grozas_01: {
            path: "audio/guns/grozas_01.mp3",
            volume: 0.95,
            maxInstances: 5,
        },
        scar_01: {
            path: "audio/guns/scar_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        scar_reload_01: {
            path: "audio/guns/scar_reload_01.mp3",
            volume: 1,
        },
        scar_switch_01: {
            path: "audio/guns/scar_switch_01.mp3",
            volume: 1,
        },
        scarssr_01: {
            path: "audio/guns/scarssr_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        dp28_01: {
            path: "audio/guns/dp28_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        dp28_reload_01: {
            path: "audio/guns/dp28_reload_01.mp3",
            volume: 1,
        },
        dp28_switch_01: {
            path: "audio/guns/dp28_switch_01.mp3",
            volume: 1,
        },
        bar_01: {
            path: "audio/guns/bar_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        bar_reload_01: {
            path: "audio/guns/bar_reload_01.mp3",
            volume: 1,
        },
        bar_switch_01: {
            path: "audio/guns/bar_switch_01.mp3",
            volume: 1,
        },
        pkp_01: {
            path: "audio/guns/pkp_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        pkp_reload_01: {
            path: "audio/guns/pkp_reload_01.mp3",
            volume: 1,
        },
        pkp_switch_01: {
            path: "audio/guns/pkp_switch_01.mp3",
            volume: 1,
        },
        m870_01: {
            path: "audio/guns/m870_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        m870_reload_01: {
            path: "audio/guns/m870_reload_01.mp3",
            volume: 1,
        },
        m870_cycle_01: {
            path: "audio/guns/m870_cycle_01.mp3",
            volume: 1,
        },
        m870_pull_01: {
            path: "audio/guns/m870_pull_01.mp3",
            volume: 1,
        },
        spas12_01: {
            path: "audio/guns/spas12_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        spas12_reload_01: {
            path: "audio/guns/spas12_reload_01.mp3",
            volume: 1,
        },
        spas12_cycle_01: {
            path: "audio/guns/spas12_cycle_01.mp3",
            volume: 1,
        },
        spas12_pull_01: {
            path: "audio/guns/spas12_pull_01.mp3",
            volume: 1,
        },
        mp220_01: {
            path: "audio/guns/mp220_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        mp220_reload_01: {
            path: "audio/guns/mp220_reload_01.mp3",
            volume: 1,
        },
        mp220_deploy_01: {
            path: "audio/guns/mp220_deploy_01.mp3",
            volume: 1,
        },
        saiga_01: {
            path: "audio/guns/saiga_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        saiga_reload_01: {
            path: "audio/guns/saiga_reload_01.mp3",
            volume: 1,
        },
        saiga_switch_01: {
            path: "audio/guns/saiga_switch_01.mp3",
            volume: 1,
        },
        usas_01: {
            path: "audio/guns/usas_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        usas_reload_01: {
            path: "audio/guns/usas_reload_01.mp3",
            volume: 1,
        },
        usas_switch_01: {
            path: "audio/guns/usas_switch_01.mp3",
            volume: 1,
        },
        m1100_01: {
            path: "audio/guns/m1100_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        m1100_reload_01: {
            path: "audio/guns/m1100_reload_01.mp3",
            volume: 1,
        },
        m1100_deploy_01: {
            path: "audio/guns/m1100_deploy_01.mp3",
            volume: 1,
        },
        m1014_01: {
            path: "audio/guns/m1014_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        m1014_reload_01: {
            path: "audio/guns/m1014_reload_01.mp3",
            volume: 1,
        },
        m1014_deploy_01: {
            path: "audio/guns/m1014_deploy_01.mp3",
            volume: 1,
        },
        m39_01: {
            path: "audio/guns/m39_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        m39_reload_01: {
            path: "audio/guns/m39_reload_01.mp3",
            volume: 1,
        },
        m39_switch_01: {
            path: "audio/guns/m39_switch_01.mp3",
            volume: 1,
        },
        svd_01: {
            path: "audio/guns/svd_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        svd_reload_01: {
            path: "audio/guns/svd_reload_01.mp3",
            volume: 1,
        },
        svd_switch_01: {
            path: "audio/guns/svd_switch_01.mp3",
            volume: 1,
        },
        garand_01: {
            path: "audio/guns/garand_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        garand_02: {
            path: "audio/guns/garand_02.mp3",
            volume: 1,
            maxInstances: 5,
        },
        garand_reload_01: {
            path: "audio/guns/garand_reload_01.mp3",
            volume: 1,
        },
        garand_switch_01: {
            path: "audio/guns/garand_switch_01.mp3",
            volume: 1,
        },
        m1a1_01: {
            path: "audio/guns/m1a1_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        m1a1_reload_01: {
            path: "audio/guns/m1a1_reload_01.mp3",
            volume: 1,
        },
        m1a1_switch_01: {
            path: "audio/guns/m1a1_switch_01.mp3",
            volume: 1,
        },
        mp5_01: {
            path: "audio/guns/mp5_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        mp5_reload_01: {
            path: "audio/guns/mp5_reload_01.mp3",
            volume: 1,
        },
        mp5_switch_01: {
            path: "audio/guns/mp5_switch_01.mp3",
            volume: 1,
        },
        mac10_01: {
            path: "audio/guns/mac10_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        mac10_reload_01: {
            path: "audio/guns/mac10_reload_01.mp3",
            volume: 1,
        },
        mac10_switch_01: {
            path: "audio/guns/mac10_switch_01.mp3",
            volume: 1,
        },
        ump9_01: {
            path: "audio/guns/ump9_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        ump9_reload_01: {
            path: "audio/guns/ump9_reload_01.mp3",
            volume: 1,
        },
        ump9_switch_01: {
            path: "audio/guns/ump9_switch_01.mp3",
            volume: 1,
        },
        vector_01: {
            path: "audio/guns/vector_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        vector_02: {
            path: "audio/guns/vector_02.mp3",
            volume: 1,
            maxInstances: 5,
        },
        vector_reload_01: {
            path: "audio/guns/vector_reload_01.mp3",
            volume: 1,
        },
        vector_switch_01: {
            path: "audio/guns/vector_switch_01.mp3",
            volume: 1,
        },
        scorpion_01: {
            path: "audio/guns/scorpion_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        scorpion_reload_01: {
            path: "audio/guns/scorpion_reload_01.mp3",
            volume: 1,
        },
        scorpion_switch_01: {
            path: "audio/guns/scorpion_switch_01.mp3",
            volume: 1,
        },
        vss_01: {
            path: "audio/guns/vss_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        vss_reload_01: {
            path: "audio/guns/vss_reload_01.mp3",
            volume: 1,
        },
        vss_switch_01: {
            path: "audio/guns/vss_switch_01.mp3",
            volume: 1,
        },
        famas_01: {
            path: "audio/guns/famas_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        famas_reload_01: {
            path: "audio/guns/famas_reload_01.mp3",
            volume: 1,
        },
        famas_switch_01: {
            path: "audio/guns/famas_switch_01.mp3",
            volume: 1,
        },
        hk416_01: {
            path: "audio/guns/hk416_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        hk416_reload_01: {
            path: "audio/guns/hk416_reload_01.mp3",
            volume: 1,
        },
        hk416_switch_01: {
            path: "audio/guns/hk416_switch_01.mp3",
            volume: 1,
        },
        m4a1_01: {
            path: "audio/guns/m4a1_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        m4a1_reload_01: {
            path: "audio/guns/m4a1_reload_01.mp3",
            volume: 1,
        },
        m4a1_switch_01: {
            path: "audio/guns/m4a1_switch_01.mp3",
            volume: 1,
        },
        mk12_01: {
            path: "audio/guns/mk12_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        mk12_reload_01: {
            path: "audio/guns/mk12_reload_01.mp3",
            volume: 1,
        },
        mk12_switch_01: {
            path: "audio/guns/mk12_switch_01.mp3",
            volume: 1,
        },
        l86_01: {
            path: "audio/guns/l86_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        l86_reload_01: {
            path: "audio/guns/l86_reload_01.mp3",
            volume: 1,
        },
        l86_switch_01: {
            path: "audio/guns/l86_switch_01.mp3",
            volume: 1,
        },
        m249_01: {
            path: "audio/guns/m249_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        m249_reload_01: {
            path: "audio/guns/m249_reload_01.mp3",
            volume: 1.5,
        },
        m249_switch_01: {
            path: "audio/guns/m249_switch_01.mp3",
            volume: 1.5,
        },
        qbb97_01: {
            path: "audio/guns/qbb97_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        qbb97_reload_01: {
            path: "audio/guns/qbb97_reload_01.mp3",
            volume: 1,
        },
        qbb97_switch_01: {
            path: "audio/guns/qbb97_switch_01.mp3",
            volume: 1,
        },
        scout_01: {
            path: "audio/guns/scout_01.mp3",
            volume: 2,
            maxInstances: 5,
        },
        scout_reload_01: {
            path: "audio/guns/scout_reload_01.mp3",
            volume: 1.2,
        },
        scout_cycle_01: {
            path: "audio/guns/scout_cycle_01.mp3",
            volume: 1.2,
        },
        scout_pull_01: {
            path: "audio/guns/scout_pull_01.mp3",
            volume: 1.2,
        },
        model94_01: {
            path: "audio/guns/model94_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        model94_reload_01: {
            path: "audio/guns/model94_reload_01.mp3",
            volume: 1,
        },
        model94_cycle_01: {
            path: "audio/guns/model94_cycle_01.mp3",
            volume: 1,
        },
        mkg45_01: {
            path: "audio/guns/mkg45_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        mkg45_reload_01: {
            path: "audio/guns/mkg45_reload_01.mp3",
            volume: 1.25,
        },
        mkg45_switch_01: {
            path: "audio/guns/mkg45_switch_01.mp3",
            volume: 1.25,
        },
        blr_01: {
            path: "audio/guns/blr_01.mp3",
            volume: 1.5,
            maxInstances: 5,
        },
        blr_reload_01: {
            path: "audio/guns/blr_reload_01.mp3",
            volume: 1,
        },
        blr_cycle_01: {
            path: "audio/guns/blr_cycle_01.mp3",
            volume: 1,
        },
        mosin_01: {
            path: "audio/guns/mosin_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        mosin_reload_01: {
            path: "audio/guns/mosin_reload_01.mp3",
            volume: 1,
        },
        mosin_reload_02: {
            path: "audio/guns/mosin_reload_02.mp3",
            volume: 1,
        },
        mosin_cycle_01: {
            path: "audio/guns/mosin_cycle_01.mp3",
            volume: 1,
        },
        mosin_pull_01: {
            path: "audio/guns/mosin_pull_01.mp3",
            volume: 1,
        },
        sv98_01: {
            path: "audio/guns/sv98_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        sv98_reload_01: {
            path: "audio/guns/sv98_reload_01.mp3",
            volume: 1,
        },
        sv98_cycle_01: {
            path: "audio/guns/sv98_cycle_01.mp3",
            volume: 1,
        },
        sv98_pull_01: {
            path: "audio/guns/sv98_pull_01.mp3",
            volume: 1,
        },
        awc_01: {
            path: "audio/guns/awc_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        awc_reload_01: {
            path: "audio/guns/awc_reload_01.mp3",
            volume: 1,
        },
        awc_cycle_01: {
            path: "audio/guns/awc_cycle_01.mp3",
            volume: 1,
        },
        awc_pull_01: {
            path: "audio/guns/awc_pull_01.mp3",
            volume: 1,
        },
        potato_cannon_01: {
            path: "audio/guns/potato_cannon_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        potato_cannon_reload_01: {
            path: "audio/guns/potato_cannon_reload_01.mp3",
            volume: 1,
        },
        potato_cannon_switch_01: {
            path: "audio/guns/potato_cannon_switch_01.mp3",
            volume: 1,
        },
        potato_smg_01: {
            path: "audio/guns/potato_smg_01.mp3",
            volume: 1,
            maxInstances: 5,
        },
        potato_smg_reload_01: {
            path: "audio/guns/potato_smg_reload_01.mp3",
            volume: 1,
        },
        potato_smg_switch_01: {
            path: "audio/guns/potato_smg_switch_01.mp3",
            volume: 1,
        },
        bugle_01: {
            path: "audio/guns/bugle_01.mp3",
            volume: 1.5,
            maxInstances: 3,
            preload: false,
        },
        bugle_02: {
            path: "audio/guns/bugle_02.mp3",
            volume: 1.5,
            maxInstances: 3,
            preload: false,
        },
        bugle_03: {
            path: "audio/guns/bugle_03.mp3",
            volume: 1.5,
            maxInstances: 3,
            preload: false,
        },
        empty_fire_01: {
            path: "audio/guns/empty_fire_01.mp3",
            volume: 0.9,
        },
        empty_fire_02: {
            path: "audio/guns/empty_fire_02.mp3",
            volume: 0.9,
        },
        gun_switch_01: {
            path: "audio/guns/gun_switch_01.mp3",
            volume: 1,
        },
        bandage_use_01: {
            path: "audio/ui/bandage_use_01.mp3",
            volume: 1,
        },
        healthkit_use_01: {
            path: "audio/ui/healthkit_use_01.mp3",
            volume: 1,
        },
        soda_use_01: {
            path: "audio/ui/soda_use_01.mp3",
            volume: 1,
        },
        pills_use_01: {
            path: "audio/ui/pills_use_01.mp3",
            volume: 1,
        },
        stow_weapon_01: {
            path: "audio/ui/stow_weapon_01.mp3",
            volume: 1,
        },
    },
    hits: {
        stone_bullet_hit_01: {
            path: "audio/hits/stone_bullet_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        wood_bullet_hit_01: {
            path: "audio/hits/wood_bullet_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        wood_bullet_hit_02: {
            path: "audio/hits/wood_bullet_hit_02.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        wood_bullet_hit_03: {
            path: "audio/hits/wood_bullet_hit_03.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        wood_bullet_hit_04: {
            path: "audio/hits/wood_bullet_hit_04.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        bush_bullet_hit_01: {
            path: "audio/hits/bush_bullet_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        metal_bullet_hit_01: {
            path: "audio/hits/metal_bullet_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        metal_bullet_hit_02: {
            path: "audio/hits/metal_bullet_hit_02.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        metal_bullet_hit_03: {
            path: "audio/hits/metal_bullet_hit_03.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        metal_bullet_hit_04: {
            path: "audio/hits/metal_bullet_hit_04.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 6,
        },
        pan_bullet_hit_01: {
            path: "audio/hits/pan_bullet_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 6,
        },
        brick_bullet_hit_01: {
            path: "audio/hits/brick_bullet_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        punch_hit_01: {
            path: "audio/hits/punch_hit_01.mp3",
            volume: 1,
        },
        knife_hit_01: {
            path: "audio/hits/knife_hit_01.mp3",
            volume: 1,
        },
        pan_hit_01: {
            path: "audio/hits/pan_hit_01.mp3",
            volume: 1,
        },
        axe_hit_01: {
            path: "audio/hits/axe_hit_01.mp3",
            volume: 1,
        },
        hook_hit_01: {
            path: "audio/hits/hook_hit_01.mp3",
            volume: 1,
        },
        saw_hit_01: {
            path: "audio/hits/saw_hit_01.mp3",
            volume: 2.5,
        },
        crowbar_hit_01: {
            path: "audio/hits/crowbar_hit_01.mp3",
            volume: 1,
        },
        spade_hit_01: {
            path: "audio/hits/spade_hit_01.mp3",
            volume: 1,
        },
        hammer_hit_01: {
            path: "audio/hits/hammer_hit_01.mp3",
            volume: 1,
        },
        metal_punch_hit_01: {
            path: "audio/hits/metal_punch_hit_01.mp3",
            volume: 1,
        },
        metal_punch_hit_02: {
            path: "audio/hits/metal_punch_hit_02.mp3",
            volume: 1,
        },
        egg_hit_01: {
            path: "audio/hits/egg_hit_01.mp3",
            volume: 1,
            preload: false,
        },
        player_bullet_hit_01: {
            path: "audio/hits/player_bullet_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        player_bullet_hit_02: {
            path: "audio/hits/player_bullet_hit_02.mp3",
            volume: 1,
            canCoalesce: true,
        },
        plastic_bullet_hit_01: {
            path: "audio/hits/plastic_bullet_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        toilet_bullet_hit_01: {
            path: "audio/hits/toilet_bullet_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        toilet_bullet_hit_02: {
            path: "audio/hits/toilet_bullet_hit_02.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        glass_bullet_hit_01: {
            path: "audio/hits/glass_bullet_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        concrete_hit_01: {
            path: "audio/hits/concrete_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        frag_grass_01: {
            path: "audio/hits/frag_grass_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        frag_sand_01: {
            path: "audio/hits/frag_sand_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        frag_water_01: {
            path: "audio/hits/frag_water_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        cloth_hit_01: {
            path: "audio/hits/cloth_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        cloth_hit_02: {
            path: "audio/hits/cloth_hit_02.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        organic_hit_01: {
            path: "audio/hits/organic_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        piano_hit_01: {
            path: "audio/hits/piano_hit_01.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
        piano_hit_02: {
            path: "audio/hits/piano_hit_02.mp3",
            volume: 1,
            canCoalesce: true,
            maxInstances: 3,
        },
    },
    sfx: {
        crate_break_01: {
            path: "audio/sfx/crate_break_01.mp3",
            volume: 1,
        },
        crate_break_02: {
            path: "audio/sfx/crate_break_02.mp3",
            volume: 1,
        },
        tree_break_01: {
            path: "audio/sfx/tree_break_01.mp3",
            volume: 1,
        },
        bush_break_01: {
            path: "audio/sfx/bush_break_01.mp3",
            volume: 1,
        },
        bush_enter_01: {
            path: "audio/sfx/bush_enter_01.mp3",
            volume: 1,
            canCoalesce: true,
        },
        bush_enter_02: {
            path: "audio/sfx/bush_enter_02.mp3",
            volume: 1,
            canCoalesce: true,
        },
        barrel_break_01: {
            path: "audio/sfx/barrel_break_01.mp3",
            volume: 1,
        },
        barrel_break_02: {
            path: "audio/sfx/barrel_break_02.mp3",
            volume: 1,
        },
        stone_break_01: {
            path: "audio/sfx/stone_break_01.mp3",
            volume: 1,
        },
        wall_break_01: {
            path: "audio/sfx/wall_break_01.mp3",
            volume: 1,
        },
        ceiling_break_01: {
            path: "audio/sfx/ceiling_break_01.mp3",
            volume: 1,
        },
        ceiling_break_02: {
            path: "audio/sfx/ceiling_break_02.mp3",
            volume: 1,
        },
        toilet_break_01: {
            path: "audio/sfx/toilet_break_01.mp3",
            volume: 1,
        },
        toilet_break_02: {
            path: "audio/sfx/toilet_break_02.mp3",
            volume: 1,
        },
        vending_break_01: {
            path: "audio/sfx/vending_break_01.mp3",
            volume: 1,
        },
        window_break_01: {
            path: "audio/sfx/window_break_01.mp3",
            volume: 1,
        },
        window_break_02: {
            path: "audio/sfx/window_break_02.mp3",
            volume: 1,
        },
        drawers_break_01: {
            path: "audio/sfx/drawers_break_01.mp3",
            volume: 1,
        },
        oven_break_01: {
            path: "audio/sfx/oven_break_01.mp3",
            volume: 1,
        },
        deposit_box_break_01: {
            path: "audio/sfx/deposit_box_break_01.mp3",
            volume: 1,
        },
        cloth_break_01: {
            path: "audio/sfx/cloth_break_01.mp3",
            volume: 1,
        },
        screen_break_01: {
            path: "audio/sfx/screen_break_01.mp3",
            volume: 1,
        },
        pumpkin_break_01: {
            path: "audio/sfx/pumpkin_break_01.mp3",
            volume: 1,
            preload: false,
        },
        ceramic_break_01: {
            path: "audio/sfx/ceramic_break_01.mp3",
            volume: 1,
        },
        egg_break_01: {
            path: "audio/sfx/egg_break_01.mp3",
            volume: 1,
            preload: false,
        },
        footstep_grass_01: {
            path: "audio/sfx/footstep_grass_01.mp3",
            volume: 1,
        },
        footstep_grass_02: {
            path: "audio/sfx/footstep_grass_02.mp3",
            volume: 1,
        },
        footstep_metal_01: {
            path: "audio/sfx/footstep_metal_01.mp3",
            volume: 1,
        },
        footstep_metal_02: {
            path: "audio/sfx/footstep_metal_02.mp3",
            volume: 1,
        },
        footstep_metal_03: {
            path: "audio/sfx/footstep_metal_03.mp3",
            volume: 1,
        },
        footstep_metal_04: {
            path: "audio/sfx/footstep_metal_04.mp3",
            volume: 1,
        },
        footstep_metal_05: {
            path: "audio/sfx/footstep_metal_05.mp3",
            volume: 1,
        },
        footstep_wood_01: {
            path: "audio/sfx/footstep_wood_01.mp3",
            volume: 1,
        },
        footstep_wood_02: {
            path: "audio/sfx/footstep_wood_02.mp3",
            volume: 1,
        },
        footstep_wood_03: {
            path: "audio/sfx/footstep_wood_03.mp3",
            volume: 1,
        },
        footstep_sand_01: {
            path: "audio/sfx/footstep_sand_01.mp3",
            volume: 1,
        },
        footstep_sand_02: {
            path: "audio/sfx/footstep_sand_02.mp3",
            volume: 1,
        },
        footstep_water_01: {
            path: "audio/sfx/footstep_water_01.mp3",
            volume: 1,
        },
        footstep_water_02: {
            path: "audio/sfx/footstep_water_02.mp3",
            volume: 1,
        },
        footstep_tile_01: {
            path: "audio/sfx/footstep_tile_01.mp3",
            volume: 1,
        },
        footstep_tile_02: {
            path: "audio/sfx/footstep_tile_02.mp3",
            volume: 1,
        },
        footstep_asphalt_01: {
            path: "audio/sfx/footstep_asphalt_01.mp3",
            volume: 1,
        },
        footstep_asphalt_02: {
            path: "audio/sfx/footstep_asphalt_02.mp3",
            volume: 1,
        },
        footstep_brick_01: {
            path: "audio/sfx/footstep_brick_01.mp3",
            volume: 1,
        },
        footstep_stone_01: {
            path: "audio/sfx/footstep_stone_01.mp3",
            volume: 0.8,
        },
        footstep_carpet_01: {
            path: "audio/sfx/footstep_carpet_01.mp3",
            volume: 1,
        },
        punch_swing_01: {
            path: "audio/sfx/punch_swing_01.mp3",
            volume: 1,
        },
        knife_swing_01: {
            path: "audio/sfx/knife_swing_01.mp3",
            volume: 1,
        },
        medium_swing_01: {
            path: "audio/sfx/medium_swing_01.mp3",
            volume: 1,
        },
        heavy_swing_01: {
            path: "audio/sfx/heavy_swing_01.mp3",
            volume: 1,
        },
        bullet_whiz_01: {
            path: "audio/sfx/bullet_whiz_01.mp3",
            volume: 1,
        },
        bullet_whiz_02: {
            path: "audio/sfx/bullet_whiz_02.mp3",
            volume: 1,
        },
        bullet_whiz_03: {
            path: "audio/sfx/bullet_whiz_03.mp3",
            volume: 1,
        },
        frag_throw_01: {
            path: "audio/sfx/frag_throw_01.mp3",
            volume: 1,
        },
        frag_pin_01: {
            path: "audio/sfx/frag_pin_01.mp3",
            volume: 1,
        },
        frag_deploy_01: {
            path: "audio/ui/frag_pickup_01.mp3",
            volume: 1,
        },
        frag_water_01: {
            path: "audio/hits/frag_water_01.mp3",
            volume: 1,
        },
        strobe_click_01: {
            path: "audio/sfx/strobe_click_01.mp3",
            volume: 1,
        },
        explosion_01: {
            path: "audio/sfx/explosion_01.mp3",
            volume: 1,
        },
        explosion_02: {
            path: "audio/sfx/explosion_02.mp3",
            volume: 1,
        },
        explosion_03: {
            path: "audio/sfx/explosion_03.mp3",
            volume: 1,
        },
        explosion_04: {
            path: "audio/sfx/explosion_04.mp3",
            volume: 1,
            maxInstances: 4,
        },
        explosion_05: {
            path: "audio/sfx/explosion_05.mp3",
            volume: 1,
        },
        explosion_smoke_01: {
            path: "audio/sfx/explosion_smoke_01.mp3",
            volume: 1,
        },
        snowball_01: {
            path: "audio/sfx/snowball_01.mp3",
            volume: 1,
            preload: false,
        },
        snowball_02: {
            path: "audio/sfx/snowball_02.mp3",
            volume: 1,
            preload: false,
        },
        potato_01: {
            path: "audio/sfx/potato_01.mp3",
            volume: 1,
            preload: false,
        },
        potato_02: {
            path: "audio/sfx/potato_02.mp3",
            volume: 1,
            preload: false,
        },
        stow_weapon_01: {
            path: "audio/ui/stow_weapon_01.mp3",
            volume: 1,
        },
        knife_deploy_01: {
            path: "audio/ui/knife_deploy_01.mp3",
            volume: 1,
        },
        pan_pickup_01: {
            path: "audio/ui/pan_pickup_01.mp3",
            volume: 1,
        },
        knuckles_deploy_01: {
            path: "audio/ui/knuckles_deploy_01.mp3",
            volume: 1,
        },
        door_open_01: {
            path: "audio/sfx/door_open_01.mp3",
            volume: 1,
        },
        door_close_01: {
            path: "audio/sfx/door_close_01.mp3",
            volume: 1,
        },
        door_open_02: {
            path: "audio/sfx/door_open_02.mp3",
            volume: 1,
        },
        door_close_02: {
            path: "audio/sfx/door_close_02.mp3",
            volume: 1,
        },
        door_open_03: {
            path: "audio/sfx/door_open_03.mp3",
            volume: 1,
        },
        door_close_03: {
            path: "audio/sfx/door_close_03.mp3",
            volume: 1,
        },
        door_open_04: {
            path: "audio/sfx/door_open_04.mp3",
            volume: 0.8,
        },
        door_error_01: {
            path: "audio/sfx/door_error_01.mp3",
            volume: 1,
        },
        vault_change_01: {
            path: "audio/sfx/vault_change_01.mp3",
            volume: 1,
        },
        vault_change_02: {
            path: "audio/sfx/vault_change_02.mp3",
            volume: 1,
            preload: false,
        },
        vault_change_03: {
            path: "audio/sfx/vault_change_03.mp3",
            volume: 1,
            preload: false,
        },
        cell_control_01: {
            path: "audio/sfx/cell_control_01.mp3",
            volume: 1,
        },
        cell_control_02: {
            path: "audio/sfx/cell_control_02.mp3",
            volume: 1,
        },
        plane_01: {
            path: "audio/sfx/plane_01.mp3",
            volume: 1,
        },
        plane_02: {
            path: "audio/sfx/plane_02.mp3",
            volume: 1,
            preload: false,
        },
        fighter_01: {
            path: "audio/sfx/fighter_01.mp3",
            volume: 1,
        },
        airdrop_chute_01: {
            path: "audio/sfx/airdrop_chute_01.mp3",
            volume: 1,
        },
        airdrop_fall_01: {
            path: "audio/sfx/airdrop_fall_01.mp3",
            volume: 1,
        },
        airdrop_crash_01: {
            path: "audio/sfx/airdrop_crash_01.mp3",
            volume: 1,
        },
        airdrop_crash_02: {
            path: "audio/sfx/airdrop_crash_02.mp3",
            volume: 1,
        },
        airdrop_open_01: {
            path: "audio/sfx/airdrop_open_01.mp3",
            volume: 1,
        },
        airdrop_open_02: {
            path: "audio/sfx/airdrop_open_02.mp3",
            volume: 1,
        },
        button_press_01: {
            path: "audio/sfx/button_press_01.mp3",
            volume: 1,
            maxInstances: 3,
        },
        watering_01: {
            path: "audio/sfx/watering_01.mp3",
            volume: 1,
            maxInstances: 3,
            preload: false,
        },
        piano_02: {
            path: "audio/sfx/piano_02.mp3",
            volume: 1,
            preload: false,
        },
        footstep_08: {
            path: "audio/sfx/footstep_08.mp3",
            volume: 1,
            preload: false,
        },
        footstep_09: {
            path: "audio/sfx/footstep_09.mp3",
            volume: 1,
            preload: false,
        },
        howl_01: {
            path: "audio/sfx/howl_01.mp3",
            volume: 1,
            preload: false,
        },
        wheel_control_01: {
            path: "audio/sfx/wheel_control_01.mp3",
            volume: 1,
            preload: false,
        },
        log_01: {
            path: "audio/sfx/log_01.mp3",
            volume: 1,
            preload: false,
        },
        log_02: {
            path: "audio/sfx/log_02.mp3",
            volume: 1,
            preload: false,
        },
        log_03: {
            path: "audio/sfx/log_03.mp3",
            volume: 1,
            preload: false,
        },
        log_04: {
            path: "audio/sfx/log_04.mp3",
            volume: 1,
            preload: false,
        },
        log_05: {
            path: "audio/sfx/log_05.mp3",
            volume: 1,
            preload: false,
        },
        log_06: {
            path: "audio/sfx/log_06.mp3",
            volume: 1,
            preload: false,
        },
        log_11: {
            path: "audio/sfx/log_11.mp3",
            volume: 4,
            preload: false,
        },
        log_12: {
            path: "audio/sfx/log_12.mp3",
            volume: 4,
            preload: false,
        },
        log_13: {
            path: "audio/sfx/log_13.mp3",
            volume: 2,
            preload: false,
        },
        log_14: {
            path: "audio/sfx/log_14.mp3",
            volume: 2,
            preload: false,
        },
        ability_stim_01: {
            path: "audio/sfx/ability_stim_01.mp3",
            volume: 4,
        },
        xp_drop_01: {
            path: "audio/sfx/xp_drop_01.mp3",
            volume: 1.25,
            preload: false,
        },
        xp_drop_02: {
            path: "audio/sfx/xp_drop_02.mp3",
            volume: 1.25,
            preload: false,
        },
        cluck_01: {
            path: "audio/sfx/cluck_01.mp3",
            volume: 1,
            preload: false,
        },
        cluck_02: {
            path: "audio/sfx/cluck_02.mp3",
            volume: 1,
            preload: false,
        },
        feather_01: {
            path: "audio/sfx/feather_01.mp3",
            volume: 1,
            preload: false,
        },
    },
    ambient: {
        ambient_wind_01: {
            path: "audio/ambient/ambient_wind_01.mp3",
            volume: 1,
            loadPriority: 1,
        },
        ambient_waves_01: {
            path: "audio/ambient/ambient_waves_01.mp3",
            volume: 1,
            loadPriority: 1,
        },
        ambient_stream_01: {
            path: "audio/ambient/ambient_stream_01.mp3",
            volume: 1,
            loadPriority: 1,
        },
        piano_music_01: {
            path: "audio/ambient/piano_music_01.mp3",
            volume: 1,
            preload: false,
        },
        ambient_wind_02: {
            path: "audio/ambient/ambient_wind_02.mp3",
            volume: 1,
            preload: false,
        },
        ambient_steam_01: {
            path: "audio/ambient/ambient_steam_01.mp3",
            volume: 1,
            preload: false,
        },
        club_music_01: {
            path: "audio/ambient/club_music_01.mp3",
            volume: 1,
            preload: false,
        },
        club_music_02: {
            path: "audio/ambient/club_music_02.mp3",
            volume: 1,
            preload: false,
        },
        ambient_lab_01: {
            path: "audio/ambient/ambient_lab_01.mp3",
            volume: 0.2,
            preload: false,
        },
    },
    ui: {
        ammo_pickup_01: {
            path: "audio/ui/ammo_pickup_01.mp3",
            volume: 1,
        },
        clothes_pickup_01: {
            path: "audio/ui/clothes_pickup_01.mp3",
            volume: 1,
        },
        bells_01: {
            path: "audio/sfx/plane_02.mp3",
            volume: 1,
            preload: false,
        },
        helmet_pickup_01: {
            path: "audio/ui/helmet_pickup_01.mp3",
            volume: 1,
        },
        chest_pickup_01: {
            path: "audio/ui/chest_pickup_01.mp3",
            volume: 1,
        },
        gun_pickup_01: {
            path: "audio/ui/gun_pickup_01.mp3",
            volume: 1,
        },
        scope_pickup_01: {
            path: "audio/ui/scope_pickup_01.mp3",
            volume: 1,
        },
        pack_pickup_01: {
            path: "audio/ui/pack_pickup_01.mp3",
            volume: 1,
        },
        soda_pickup_01: {
            path: "audio/ui/soda_pickup_01.mp3",
            volume: 1,
        },
        pills_pickup_01: {
            path: "audio/ui/pills_pickup_01.mp3",
            volume: 1,
        },
        bandage_pickup_01: {
            path: "audio/ui/bandage_pickup_01.mp3",
            volume: 1,
        },
        healthkit_pickup_01: {
            path: "audio/ui/healthkit_pickup_01.mp3",
            volume: 1,
        },
        frag_pickup_01: {
            path: "audio/ui/frag_pickup_01.mp3",
            volume: 1,
        },
        snowball_pickup_01: {
            path: "audio/ui/snowball_pickup_01.mp3",
            volume: 1,
            preload: false,
        },
        potato_pickup_01: {
            path: "audio/ui/potato_pickup_01.mp3",
            volume: 1,
            preload: false,
        },
        heavy_pickup_01: {
            path: "audio/ui/heavy_pickup_01.mp3",
            volume: 1,
        },
        pan_pickup_01: {
            path: "audio/ui/pan_pickup_01.mp3",
            volume: 1,
        },
        perk_pickup_01: {
            path: "audio/ui/perk_pickup_01.mp3",
            volume: 1,
        },
        xp_pickup_01: {
            path: "audio/ui/xp_pickup_01.mp3",
            volume: 1.5,
            preload: false,
        },
        xp_pickup_02: {
            path: "audio/ui/xp_pickup_02.mp3",
            volume: 1.5,
            preload: false,
        },
        ping_danger_01: {
            path: "audio/ui/ping_danger_01.mp3",
            volume: 1,
        },
        ping_coming_01: {
            path: "audio/ui/ping_coming_01.mp3",
            volume: 1,
        },
        ping_help_01: {
            path: "audio/ui/ping_help_01.mp3",
            volume: 1,
        },
        ping_leader_01: {
            path: "audio/ui/ping_leader_01.mp3",
            volume: 1,
            preload: false,
        },
        ping_airdrop_01: {
            path: "audio/ui/ping_airdrop_01.mp3",
            volume: 1,
        },
        ping_airstrike_01: {
            path: "audio/ui/ping_airstrike_01.mp3",
            volume: 1,
        },
        ping_unlock_01: {
            path: "audio/ui/ping_unlock_01.mp3",
            volume: 1,
            preload: false,
        },
        emote_01: {
            path: "audio/ui/emote_01.mp3",
            volume: 1,
        },
        trick_01: {
            path: "audio/ui/trick_01.mp3",
            volume: 1.5,
            preload: false,
        },
        trick_02: {
            path: "audio/ui/trick_02.mp3",
            volume: 1.5,
            preload: false,
        },
        trick_03: {
            path: "audio/ui/trick_03.mp3",
            volume: 1.5,
            preload: false,
        },
        treat_01: {
            path: "audio/ui/treat_01.mp3",
            volume: 1,
            preload: false,
        },
        loot_drop_01: {
            path: "audio/ui/loot_drop_01.mp3",
            volume: 1,
        },
        notification_start_01: {
            path: "audio/ui/notification_start_01.mp3",
            volume: 1,
        },
        notification_join_01: {
            path: "audio/ui/notification_join_01.mp3",
            volume: 1,
        },
        leader_assigned_01: {
            path: "audio/ui/leader_assigned_01.mp3",
            volume: 1,
            maxInstances: 1,
        },
        leader_dead_01: {
            path: "audio/ui/leader_dead_01.mp3",
            volume: 1.75,
            maxInstances: 1,
        },
        captain_assigned_01: {
            path: "audio/ui/captain_assigned_01.mp3",
            volume: 2,
            preload: false,
            maxInstances: 1,
        },
        lt_assigned_01: {
            path: "audio/ui/lt_assigned_01.mp3",
            volume: 1,
            preload: false,
            maxInstances: 1,
        },
        medic_assigned_01: {
            path: "audio/ui/medic_assigned_01.mp3",
            volume: 2,
            preload: false,
            maxInstances: 1,
        },
        marksman_assigned_01: {
            path: "audio/ui/marksman_assigned_01.mp3",
            volume: 2,
            preload: false,
            maxInstances: 1,
        },
        recon_assigned_01: {
            path: "audio/ui/recon_assigned_01.mp3",
            volume: 1.5,
            preload: false,
            maxInstances: 1,
        },
        grenadier_assigned_01: {
            path: "audio/ui/grenadier_assigned_01.mp3",
            volume: 2.5,
            preload: false,
            maxInstances: 1,
        },
        bugler_assigned_01: {
            path: "audio/ui/bugler_assigned_01.mp3",
            volume: 2.5,
            preload: false,
            maxInstances: 1,
        },
        last_man_assigned_01: {
            path: "audio/ui/last_man_assigned_01.mp3",
            volume: 1.75,
            preload: false,
            maxInstances: 1,
        },
        helmet03_forest_pickup_01: {
            path: "audio/ui/helmet03_forest_pickup_01.mp3",
            volume: 1,
            maxInstances: 1,
            preload: false,
        },
        kill_leader_assigned_01: {
            path: "audio/ui/kill_leader_assigned_01.mp3",
            volume: 1.5,
            maxInstances: 1,
            preload: false,
        },
        kill_leader_assigned_02: {
            path: "audio/ui/kill_leader_assigned_02.mp3",
            volume: 1.5,
            maxInstances: 1,
            preload: false,
        },
        kill_leader_dead_01: {
            path: "audio/ui/kill_leader_dead_01.mp3",
            volume: 1.5,
            maxInstances: 1,
            preload: false,
        },
        kill_leader_dead_02: {
            path: "audio/ui/kill_leader_dead_02.mp3",
            volume: 1.5,
            maxInstances: 1,
            preload: false,
        },
        spawn_01: {
            path: "audio/ui/spawn_01.mp3",
            volume: 3,
            preload: false,
        },
    },
    music: {
        menu_music: {
            path: "audio/ambient/menu_music_01.mp3",
            volume: 1,
            loadPriority: 2,
        },
    },
};
const Groups: Record<string, { channel: string; sounds: string[] }> = {
    footstep_grass: {
        channel: "sfx",
        sounds: ["footstep_grass_01", "footstep_grass_02"],
    },
    footstep_container: {
        channel: "sfx",
        sounds: ["footstep_metal_03"],
    },
    footstep_warehouse: {
        channel: "sfx",
        sounds: ["footstep_metal_01", "footstep_metal_02"],
    },
    footstep_house: {
        channel: "sfx",
        sounds: ["footstep_wood_02", "footstep_wood_03"],
    },
    footstep_shack: {
        channel: "sfx",
        sounds: ["footstep_wood_01"],
    },
    footstep_sand: {
        channel: "sfx",
        sounds: ["footstep_sand_01", "footstep_sand_02"],
    },
    footstep_water: {
        channel: "sfx",
        sounds: ["footstep_water_01", "footstep_water_02"],
    },
    footstep_tile: {
        channel: "sfx",
        sounds: ["footstep_tile_01", "footstep_tile_02"],
    },
    footstep_asphalt: {
        channel: "sfx",
        sounds: ["footstep_asphalt_01", "footstep_asphalt_02"],
    },
    footstep_brick: {
        channel: "sfx",
        sounds: ["footstep_brick_01"],
    },
    footstep_bunker: {
        channel: "sfx",
        sounds: ["footstep_metal_04", "footstep_metal_05"],
    },
    footstep_stone: {
        channel: "sfx",
        sounds: ["footstep_stone_01"],
    },
    footstep_carpet: {
        channel: "sfx",
        sounds: ["footstep_carpet_01"],
    },
    player_bullet_hit: {
        channel: "hits",
        sounds: ["player_bullet_hit_01"],
    },
    metal_punch: {
        channel: "hits",
        sounds: ["metal_punch_hit_01", "metal_punch_hit_02"],
    },
    cloth_punch: {
        channel: "hits",
        sounds: ["cloth_hit_01"],
    },
    cloth_bullet: {
        channel: "hits",
        sounds: ["cloth_hit_02"],
    },
    organic_hit: {
        channel: "hits",
        sounds: ["organic_hit_01"],
    },
    piano_hit: {
        channel: "hits",
        sounds: ["piano_hit_01", "piano_hit_02"],
    },
    wall_bullet: {
        channel: "hits",
        sounds: ["metal_bullet_hit_01"],
    },
    wall_wood_bullet: {
        channel: "hits",
        sounds: ["wood_bullet_hit_02"],
    },
    wall_brick_bullet: {
        channel: "hits",
        sounds: ["brick_bullet_hit_01"],
    },
    stone_bullet: {
        channel: "hits",
        sounds: ["stone_bullet_hit_01"],
    },
    barrel_bullet: {
        channel: "hits",
        sounds: ["metal_bullet_hit_03"],
    },
    pan_bullet: {
        channel: "hits",
        sounds: ["pan_bullet_hit_01"],
    },
    silo_bullet: {
        channel: "hits",
        sounds: ["metal_bullet_hit_04"],
    },
    toilet_porc_bullet: {
        channel: "hits",
        sounds: ["toilet_bullet_hit_01"],
    },
    toilet_metal_bullet: {
        channel: "hits",
        sounds: ["toilet_bullet_hit_02"],
    },
    glass_bullet: {
        channel: "hits",
        sounds: ["glass_bullet_hit_01"],
    },
    cobalt_bullet: {
        channel: "hits",
        sounds: ["metal_bullet_hit_02"],
    },
    concrete_hit: {
        channel: "hits",
        sounds: ["concrete_hit_01"],
    },
    wood_prop_bullet: {
        channel: "hits",
        sounds: ["wood_bullet_hit_03"],
    },
    wood_crate_bullet: {
        channel: "hits",
        sounds: ["wood_bullet_hit_04"],
    },
    ammo_crate_bullet: {
        channel: "hits",
        sounds: ["plastic_bullet_hit_01"],
    },
    bush_bullet: {
        channel: "hits",
        sounds: ["bush_bullet_hit_01"],
    },
    tree_bullet: {
        channel: "hits",
        sounds: ["wood_bullet_hit_01"],
    },
    egg_hit: {
        channel: "hits",
        sounds: ["egg_hit_01"],
    },
    player_bullet_grunt: {
        channel: "hits",
        sounds: ["player_bullet_hit_02"],
    },
    bullet_whiz: {
        channel: "sfx",
        sounds: ["bullet_whiz_01", "bullet_whiz_02", "bullet_whiz_03"],
    },
    frag_grass: {
        channel: "hits",
        sounds: ["frag_grass_01"],
    },
    frag_sand: {
        channel: "hits",
        sounds: ["frag_sand_01"],
    },
    frag_water: {
        channel: "hits",
        sounds: ["frag_water_01"],
    },
    kill_leader_assigned: {
        channel: "ui",
        sounds: ["kill_leader_assigned_01", "kill_leader_assigned_02"],
    },
    kill_leader_dead: {
        channel: "ui",
        sounds: ["kill_leader_dead_01", "kill_leader_dead_02"],
    },
    cluck: {
        channel: "sfx",
        sounds: ["cluck_01", "cluck_02"],
    },
};
const Channels: Record<string, ChannelDef> = {
    activePlayer: {
        volume: 0.5,
        maxRange: 48,
        list: "players",
        type: "sound",
    },
    otherPlayers: {
        volume: 0.5,
        maxRange: 48,
        list: "players",
        type: "sound",
    },
    hits: {
        volume: 0.4,
        maxRange: 48,
        list: "hits",
        type: "sound",
    },
    sfx: {
        volume: 1,
        maxRange: 48,
        list: "sfx",
        type: "sound",
    },
    ambient: {
        volume: 1,
        maxRange: 1,
        list: "ambient",
        type: "sound",
    },
    ui: {
        volume: 0.75,
        maxRange: 48,
        list: "ui",
        type: "sound",
    },
    music: {
        volume: 1,
        maxRange: 1,
        list: "music",
        type: "music",
    },
};
const Reverbs: Record<string, ReverbDef> = {
    cathedral: {
        path: "audio/reverb/cathedral_01.mp3",
        volume: 0.7,
        stereoSpread: 0.004,
    },
    cave: {
        path: "audio/reverb/cave_mono_01.mp3",
        volume: 0.7,
        echoVolume: 0.5,
        echoDelay: 0.25,
        echoLowPass: 800,
        stereoSpread: 0.004,
    },
};

export default {
    Sounds,
    Groups,
    Channels,
    Reverbs,
};
