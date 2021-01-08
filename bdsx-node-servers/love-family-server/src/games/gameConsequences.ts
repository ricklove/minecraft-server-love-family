import { NetworkIdentifier } from "bdsx";

export type GamePlayerInfo = { networkIdentifier: NetworkIdentifier, playerName: string, entity: IEntity };
export type GameConsequenceType = {
    onCorrect: (player: GamePlayerInfo) => void,
    onWrong: (player: GamePlayerInfo) => void,
};

export const createGameConsequences = (system: IVanillaServerSystem): GameConsequenceType => {
    return {
        onCorrect: (player) => {
            // TODO: Reward player
        },
        onWrong: (player) => {
            // Player Consequence
            const pos = system.getComponent(player.entity, MinecraftComponent.Position);
            if (!pos) { return; }

            system.executeCommand(`/summon lightning_bolt ${pos.data.x + 1} ${pos.data.y + 0} ${pos.data.z + 1}`, () => { });
            system.executeCommand(`/summon lightning_bolt ${pos.data.x + 1} ${pos.data.y + 0} ${pos.data.z - 1}`, () => { });
            system.executeCommand(`/summon lightning_bolt ${pos.data.x - 1} ${pos.data.y + 0} ${pos.data.z + 1}`, () => { });
            system.executeCommand(`/summon lightning_bolt ${pos.data.x - 1} ${pos.data.y + 0} ${pos.data.z - 1}`, () => { });
        },
    };
};