// import { NetworkIdentifier, netevent, PacketId, createPacket, sendPacket, nethook } from "bdsx";
import { NetworkIdentifier } from "../types";
import { Subscription, SubscriptionCallback } from "../utils/subscriptions";

// const call_simple = () => {

//     createConnectionsTrackingService({
//         onLogin: (callback) => {
//             nethook.after(PacketId.Login).on((ptr, networkIdentifier, packetId) => {
//                 callback({
//                     networkIdentifier,
//                     xuid: ptr.connreq.cert.getId(),
//                     username: ptr.connreq.cert.getIdentityName(),
//                 });
//             });
//         },
//         onClose: (callback) => {
//             NetworkIdentifier.close.on((networkIdentifier) => {
//                 callback({ networkIdentifier });
//             });
//         },
//     });
// };
export type ConnectionsTrackingServiceDependencies = {
    onLogin: (callback: SubscriptionCallback<{ networkIdentifier: NetworkIdentifier, xuid: string, username: string, }>) => void,
    onClose: (callback: SubscriptionCallback<{ networkIdentifier: NetworkIdentifier }>) => void,
};
export const createConnectionsTrackingService = (dependencies: ConnectionsTrackingServiceDependencies) => {

    // Network Hooking: disconnected
    const connectionList = new Map<NetworkIdentifier, string>();
    const connectionList_reverse = new Map<string, NetworkIdentifier>();

    const startConnectionTracking = () => {

        //nethook.after(PacketId.Login).on((ptr, networkIdentifier, packetId) => {
        dependencies.onLogin(({ networkIdentifier, username, xuid: xuid }) => {
            const ip = networkIdentifier.getAddress();

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

        dependencies.onClose(({ networkIdentifier }) => {
            const playerName = connectionList.get(networkIdentifier) || '';
            connectionList.delete(networkIdentifier);
            console.log(`${playerName}> disconnected`);

            playersSubscription.next({ action: 'dropped', networkIdentifier, playerName });
        });
    };

    const playersSubscription = new Subscription<{ action: 'joined' | 'dropped', networkIdentifier: NetworkIdentifier, playerName: string }>();

    const service = {
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

    return service;
};

export type ConnectionsTrackingServiceType = ReturnType<typeof createConnectionsTrackingService>;
