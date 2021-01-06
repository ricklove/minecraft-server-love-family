import { NetworkIdentifier, netevent, PacketId, createPacket, sendPacket } from "bdsx";
import { Subscription } from "../utils/subscriptions";

// Network Hooking: disconnected
const connectionList = new Map<NetworkIdentifier, string>();
const connectionList_reverse = new Map<string, NetworkIdentifier>();

const startConnectionTracking = () => {
    netevent.after(PacketId.Login).on((ptr, networkIdentifier, packetId) => {
        const ip = networkIdentifier.getAddress();
        const [xuid, username] = netevent.readLoginPacket(ptr);
        console.log(`${username}> IP=${ip}, XUID=${xuid}`);
        if (username) {
            connectionList.set(networkIdentifier, username);
            connectionList_reverse.set(username, networkIdentifier);
        }

        // Give time to complete login
        // TODO: Detect login completion
        setTimeout(() => {
            playersSubscription.next({ action: 'joined', networkIdentifier, playerName: username });
        }, 10 * 1000);
    });
    netevent.close.on(networkIdentifier => {
        const playerName = connectionList.get(networkIdentifier) || '';
        connectionList.delete(networkIdentifier);
        console.log(`${playerName}> disconnected`);

        playersSubscription.next({ action: 'dropped', networkIdentifier, playerName });
    });
};

const playersSubscription = new Subscription<{ action: 'joined' | 'dropped', networkIdentifier: NetworkIdentifier, playerName: string }>();

export const connectionsApi = {
    startConnectionTracking,
    connectionList,
    connectionList_reverse,
    getPlayerConnections: () => {

        return [...connectionList.entries()].map(x => {
            const networkIdentifier = x[0];
            const playerName = x[1];

            const actor = networkIdentifier.getActor();
            if (!actor) {
                console.warn(`missing actor`);
                return;
            }

            const isPlayer = actor.isPlayer();
            const entity = actor.getEntity();
            if (!entity || !isPlayer) {
                console.warn(`missing entity or not player`);
                return;
            }

            return ({
                playerName,
                networkIdentifier,
                entity
            });
        }).filter(x => x).map(x => x!);
    },
    onPlayersChange: playersSubscription.subscribe,
};